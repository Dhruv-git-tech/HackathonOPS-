from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
import pandas as pd
import os
import uuid
import json
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr
import qrcode
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Image, Spacer
from reportlab.lib import colors
from io import BytesIO
import tempfile
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Hackathon Management System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/hackathon_db")
client = MongoClient(mongo_url)
db = client.hackathon_db

# Collections
teams_collection = db.teams
judges_collection = db.judges
scores_collection = db.scores
certificates_collection = db.certificates
users_collection = db.users

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Pydantic models
class UserLogin(BaseModel):
    username: str
    password: str

class TeamMember(BaseModel):
    name: str
    email: EmailStr
    gender: str
    isLead: bool = False

class Team(BaseModel):
    teamName: str
    problemStatement: Optional[str] = None
    track: Optional[str] = None
    githubLink: Optional[str] = None
    presentationLink: Optional[str] = None
    videoLink: Optional[str] = None
    members: List[TeamMember]

class Judge(BaseModel):
    name: str
    email: EmailStr
    assignedTeams: List[str] = []

class ScoreSubmission(BaseModel):
    teamId: str
    criteria: Dict[str, int]
    comments: Optional[str] = None

class CertificateRequest(BaseModel):
    teamIds: List[str]
    certificateType: str = "Participation"

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return {"username": username, "role": payload.get("role")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def validate_team_data(team_data: Dict) -> List[str]:
    errors = []
    
    # Check if team has exactly 6 members
    member_count = sum(1 for i in range(1, 7) if team_data.get(f'Member_{i}_Name'))
    if member_count != 6:
        errors.append(f"Team must have exactly 6 members, found {member_count}")
    
    # Check gender composition
    genders = []
    for i in range(1, 7):
        gender = team_data.get(f'Member_{i}_Gender', '').strip().lower()
        if gender:
            genders.append(gender)
    
    if not any(g in ['female', 'f'] for g in genders):
        errors.append("Team must have at least one female member")
    
    return errors

# Create default admin user
@app.on_event("startup")
async def create_default_users():
    if users_collection.count_documents({}) == 0:
        default_users = [
            {
                "username": "admin",
                "password": get_password_hash("admin123"),
                "role": "admin",
                "email": "admin@hackathon.edu"
            },
            {
                "username": "judge1",
                "password": get_password_hash("judge123"),
                "role": "judge",
                "email": "judge1@hackathon.edu"
            }
        ]
        users_collection.insert_many(default_users)

# Routes
@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    user = users_collection.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]}, 
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user["role"],
        "username": user["username"]
    }

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    total_participants = sum(len(team["members"]) for team in teams_collection.find())
    total_teams = teams_collection.count_documents({})
    submitted_projects = teams_collection.count_documents({"githubLink": {"$ne": None, "$ne": ""}})
    
    # Teams per track
    pipeline = [
        {"$group": {"_id": "$track", "count": {"$sum": 1}}},
        {"$match": {"_id": {"$ne": None}}}
    ]
    teams_per_track = list(teams_collection.aggregate(pipeline))
    
    return {
        "totalParticipants": total_participants,
        "totalTeams": total_teams,
        "submittedProjects": submitted_projects,
        "teamsPerTrack": teams_per_track,
        "judgingStatus": "Round 1 - In Progress"
    }

@app.post("/api/teams/import")
async def import_teams(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can import data")
    
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="File must be CSV or XLSX format")
    
    try:
        content = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(content))
        else:
            df = pd.read_excel(BytesIO(content))
        
        imported_teams = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                team_data = row.to_dict()
                validation_errors = validate_team_data(team_data)
                
                if validation_errors:
                    errors.extend([f"Row {index + 2}: {error}" for error in validation_errors])
                    continue
                
                # Build team object
                members = []
                for i in range(1, 7):
                    name = team_data.get(f'Member_{i}_Name')
                    email = team_data.get(f'Member_{i}_Email')
                    gender = team_data.get(f'Member_{i}_Gender')
                    
                    if name and email:
                        members.append({
                            "name": str(name).strip(),
                            "email": str(email).strip(),
                            "gender": str(gender).strip(),
                            "isLead": i == 1  # First member is team lead
                        })
                
                team = {
                    "teamName": str(team_data.get('Team_Name', '')).strip(),
                    "problemStatement": str(team_data.get('Problem_Statement_Title', '')).strip(),
                    "track": str(team_data.get('Track', '')).strip(),
                    "members": members,
                    "githubLink": "",
                    "presentationLink": "",
                    "videoLink": "",
                    "createdAt": datetime.utcnow()
                }
                
                # Update or insert team
                result = teams_collection.update_one(
                    {"teamName": team["teamName"]},
                    {"$set": team},
                    upsert=True
                )
                imported_teams.append(team["teamName"])
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
        
        return {
            "success": True,
            "importedCount": len(imported_teams),
            "errors": errors,
            "importedTeams": imported_teams
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@app.get("/api/teams/search")
async def search_teams(q: str = Query(...), current_user: dict = Depends(get_current_user)):
    query = {
        "$or": [
            {"teamName": {"$regex": q, "$options": "i"}},
            {"members.name": {"$regex": q, "$options": "i"}},
            {"members.email": {"$regex": q, "$options": "i"}}
        ]
    }
    teams = list(teams_collection.find(query))
    
    # Convert ObjectId to string
    for team in teams:
        team["_id"] = str(team["_id"])
    
    return teams

@app.get("/api/teams/{team_id}")
async def get_team(team_id: str, current_user: dict = Depends(get_current_user)):
    from bson import ObjectId
    try:
        team = teams_collection.find_one({"_id": ObjectId(team_id)})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        team["_id"] = str(team["_id"])
        
        # Get scores for this team
        scores = list(scores_collection.find({"teamId": team_id}))
        for score in scores:
            score["_id"] = str(score["_id"])
        team["scores"] = scores
        
        return team
    except:
        raise HTTPException(status_code=404, detail="Invalid team ID")

@app.put("/api/teams/{team_id}")
async def update_team(team_id: str, team_data: dict, current_user: dict = Depends(get_current_user)):
    from bson import ObjectId
    try:
        result = teams_collection.update_one(
            {"_id": ObjectId(team_id)},
            {"$set": team_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Team not found")
        return {"success": True}
    except:
        raise HTTPException(status_code=404, detail="Invalid team ID")

@app.post("/api/judges/{judge_id}/score")
async def submit_score(judge_id: str, score_data: ScoreSubmission, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "judge" and current_user["username"] != judge_id:
        raise HTTPException(status_code=403, detail="Can only submit scores for assigned teams")
    
    total_score = sum(score_data.criteria.values())
    
    score = {
        "teamId": score_data.teamId,
        "judgeId": judge_id,
        "round": 1,
        "criteria": score_data.criteria,
        "totalScore": total_score,
        "comments": score_data.comments,
        "submittedAt": datetime.utcnow()
    }
    
    # Update or insert score
    result = scores_collection.update_one(
        {"teamId": score_data.teamId, "judgeId": judge_id, "round": 1},
        {"$set": score},
        upsert=True
    )
    
    return {"success": True, "totalScore": total_score}

@app.get("/api/judges/{judge_id}/teams")
async def get_judge_teams(judge_id: str, current_user: dict = Depends(get_current_user)):
    judge = judges_collection.find_one({"email": judge_id})
    if not judge:
        raise HTTPException(status_code=404, detail="Judge not found")
    
    from bson import ObjectId
    team_ids = [ObjectId(tid) for tid in judge.get("assignedTeams", [])]
    teams = list(teams_collection.find({"_id": {"$in": team_ids}}))
    
    for team in teams:
        team["_id"] = str(team["_id"])
        # Check if judge has already scored this team
        existing_score = scores_collection.find_one({
            "teamId": str(team["_id"]), 
            "judgeId": judge_id
        })
        team["hasScored"] = bool(existing_score)
    
    return teams

@app.post("/api/certificates/generate")
async def generate_certificates(cert_request: CertificateRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can generate certificates")
    
    generated_certs = []
    
    for team_id in cert_request.teamIds:
        from bson import ObjectId
        team = teams_collection.find_one({"_id": ObjectId(team_id)})
        if not team:
            continue
            
        for member in team["members"]:
            cert_id = str(uuid.uuid4())
            certificate = {
                "certificateId": cert_id,
                "participantName": member["name"],
                "participantEmail": member["email"],
                "teamName": team["teamName"],
                "eventName": "InnovateFest 2025",
                "issueDate": datetime.utcnow(),
                "type": cert_request.certificateType
            }
            
            certificates_collection.insert_one(certificate)
            generated_certs.append(cert_id)
    
    return {"success": True, "certificateIds": generated_certs}

@app.get("/api/certificates/verify/{cert_id}")
async def verify_certificate(cert_id: str):
    cert = certificates_collection.find_one({"certificateId": cert_id})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    cert["_id"] = str(cert["_id"])
    return cert

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)