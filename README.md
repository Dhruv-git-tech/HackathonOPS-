# Hackathon Management System

A comprehensive web application to manage internal college hackathons, inspired by platforms like Smart India Hackathon (SIH). This system serves as a central dashboard for organizers to manage the entire event lifecycle, from registration data import to final certificate generation.

## Features

### Admin Dashboard
- At-a-glance statistics (participants, teams, submissions)
- Visual charts showing team distribution by tracks
- Quick action buttons for key management tasks
- Recent activity timeline

### Data Management & Bulk Import
- Support for CSV and XLSX file uploads
- Automatic data validation (6 members per team, gender composition)
- Error reporting with detailed feedback
- Team update logic to prevent duplicates

### Team & Participant Management  
- Universal search across teams and participants
- Detailed team view with project submission links
- Edit capabilities for project information
- Member information with role identification

### Judging & Evaluation System
- Judge-specific dashboard with assigned teams
- Rubric-based scoring system (Innovation, Technical, Feasibility, etc.)
- Real-time score submission and tracking
- Comments and feedback support

### QR-Based Digital Certificate Generator  
- Professional certificate templates
- Unique QR codes for verification
- Bulk certificate generation
- Public verification page

## Technology Stack

- **Frontend**: React 18 + Tailwind CSS
- **Backend**: FastAPI + Python 3.11
- **Database**: MongoDB
- **Authentication**: JWT-based authentication
- **File Processing**: Pandas for CSV/XLSX parsing
- **Certificate Generation**: ReportLab for PDF generation
- **QR Codes**: qrcode library

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 16+
- MongoDB
- Yarn package manager

### Installation

1. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   yarn install
   ```

3. **Environment Configuration**
   - Backend: Update `backend/.env` with your MongoDB URL
   - Frontend: Update `frontend/.env` with your backend URL

4. **Start Services**
   ```bash
   # Start backend (Port 8001)
   cd backend && python server.py
   
   # Start frontend (Port 3000)  
   cd frontend && yarn start
   ```

## Default Users

- **Admin**: `admin` / `admin123`
- **Judge**: `judge1` / `judge123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics

### Teams
- `POST /api/teams/import` - Import teams from CSV/XLSX
- `GET /api/teams/search` - Search teams
- `GET /api/teams/{id}` - Get team details
- `PUT /api/teams/{id}` - Update team information

### Judging
- `POST /api/judges/{id}/score` - Submit scores
- `GET /api/judges/{id}/teams` - Get assigned teams

### Certificates
- `POST /api/certificates/generate` - Generate certificates
- `GET /api/certificates/verify/{id}` - Verify certificate

## Data Models

### Team Structure
```json
{
  "teamName": "Code Wizards",
  "problemStatement": "Campus Navigation App", 
  "track": "Smart Campus",
  "members": [
    {
      "name": "John Doe",
      "email": "john@college.edu",
      "gender": "Male",
      "isLead": true
    }
  ],
  "githubLink": "https://github.com/...",
  "presentationLink": "https://docs.google.com/...",
  "videoLink": "https://youtube.com/..."
}
```

### CSV Import Format
Required columns for team import:
- `Team_Name`
- `Problem_Statement_Title` 
- `Track` (optional)
- `Member_1_Name`, `Member_1_Email`, `Member_1_Gender`
- `Member_2_Name`, `Member_2_Email`, `Member_2_Gender`
- ... up to `Member_6_Name`, `Member_6_Email`, `Member_6_Gender`

### Validation Rules
- Exactly 6 members per team
- At least one female member per team
- Valid email addresses required
- Gender values: Male/Female/M/F (case insensitive)

## Certificate Verification

Each generated certificate includes a unique QR code linking to:
`{your-domain}/api/certificates/verify/{certificate_id}`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.