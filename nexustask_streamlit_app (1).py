# app.py
import streamlit as st
import sqlite3
import pandas as pd
import plotly.express as px
import requests, json
from datetime import datetime
from streamlit import components

# ----------------- DATABASE -----------------
def init_db():
    conn = sqlite3.connect("nexustask.db")
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT,
                    password TEXT,
                    role TEXT,
                    team TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT,
                    description TEXT,
                    status TEXT,
                    assigned_to TEXT,
                    team TEXT,
                    due_date TEXT)''')
    conn.commit()
    conn.close()

def seed_data():
    conn = sqlite3.connect("nexustask.db")
    c = conn.cursor()
    c.execute("SELECT * FROM users")
    if not c.fetchall():
        users = [
            ("admin", "admin", "admin", "All"),
            ("alice", "123", "team_head", "Alpha"),
            ("bob", "123", "team_member", "Alpha"),
            ("carol", "123", "team_head", "Beta"),
            ("dave", "123", "team_member", "Beta"),
        ]
        c.executemany("INSERT INTO users (username,password,role,team) VALUES (?,?,?,?)", users)

    c.execute("SELECT * FROM tasks")
    if not c.fetchall():
        tasks = [
            ("Design UI", "Homepage mockup", "Pending", "bob", "Alpha", "2025-09-10"),
            ("Backend API", "Login API", "In Progress", "bob", "Alpha", "2025-09-12"),
            ("Testing", "Unit tests for Beta", "Completed", "dave", "Beta", "2025-09-08"),
        ]
        c.executemany("INSERT INTO tasks (title,description,status,assigned_to,team,due_date) VALUES (?,?,?,?,?,?)", tasks)

    conn.commit()
    conn.close()

init_db()
seed_data()

# ----------------- HELPERS -----------------
def login_user(username, password):
    conn = sqlite3.connect("nexustask.db")
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username=? AND password=?", (username, password))
    user = c.fetchone()
    conn.close()
    return user

def fetch_tasks(team=None, assigned_to=None):
    conn = sqlite3.connect("nexustask.db")
    c = conn.cursor()
    if assigned_to:
        c.execute("SELECT * FROM tasks WHERE assigned_to=?", (assigned_to,))
    elif team:
        c.execute("SELECT * FROM tasks WHERE team=?", (team,))
    else:
        c.execute("SELECT * FROM tasks")
    rows = c.fetchall()
    conn.close()
    return pd.DataFrame(rows, columns=["id","title","description","status","assigned_to","team","due_date"])

def add_task(title, desc, assigned_to, team, due_date):
    conn = sqlite3.connect("nexustask.db")
    c = conn.cursor()
    c.execute("INSERT INTO tasks (title,description,status,assigned_to,team,due_date) VALUES (?,?,?,?,?,?)",
              (title, desc, "Pending", assigned_to, team, due_date))
    conn.commit()
    conn.close()

def gemini_breakdown(task_title, api_key):
    try:
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        headers = {"Content-Type": "application/json"}
        params = {"key": api_key}
        data = {"contents": [{"parts": [{"text": f"Break down the task: {task_title} into subtasks"}]}]}
        resp = requests.post(url, headers=headers, params=params, data=json.dumps(data))
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        return f"Error: {e}"

# ----------------- STREAMLIT -----------------
st.set_page_config(page_title="NexusTask", layout="wide")

if "user" not in st.session_state:
    st.session_state.user = None

if st.session_state.user is None:
    st.markdown("<h1 style='text-align:center;'>🔑 NexusTask Login</h1>", unsafe_allow_html=True)
    username = st.text_input("Username")
    password = st.text_input("Password", type="password")
    if st.button("Login"):
        user = login_user(username, password)
        if user:
            st.session_state.user = {"id": user[0], "username": user[1], "role": user[3], "team": user[4]}
            st.rerun()
        else:
            st.error("Invalid credentials")
else:
    user = st.session_state.user
    st.sidebar.success(f"👤 {user['username']} ({user['role']})")
    if st.sidebar.button("Logout"):
        st.session_state.user = None
        st.rerun()

    # Admin
    if user['role'] == "admin":
        st.header("📊 Admin Dashboard")
        tasks = fetch_tasks()
        st.dataframe(tasks, use_container_width=True)
        fig = px.histogram(tasks, x="status", color="team", barmode="group", title="Task Status Distribution")
        st.plotly_chart(fig, use_container_width=True)

    # Team Head
    elif user['role'] == "team_head":
        st.header("👥 Team Head Dashboard")
        tasks = fetch_tasks(team=user['team'])
        st.dataframe(tasks, use_container_width=True)
        with st.form("add_task"):
            title = st.text_input("Task Title")
            desc = st.text_area("Description")
            assigned_to = st.text_input("Assign To")
            due_date = st.date_input("Due Date")
            if st.form_submit_button("Add Task"):
                add_task(title, desc, assigned_to, user['team'], due_date.strftime('%Y-%m-%d'))
                st.success("✅ Task added!")

    # Team Member
    elif user['role'] == "team_member":
        st.header("📝 My Tasks")
        tasks = fetch_tasks(assigned_to=user['username'])
        st.dataframe(tasks, use_container_width=True)

        api_key = st.text_input("Gemini API Key", type="password")
        if st.button("Break Down First Task"):
            if not tasks.empty:
                task_title = tasks.iloc[0]["title"]
                st.info(gemini_breakdown(task_title, api_key))

# ----------------- 3D BACKGROUND -----------------
threejs = """
<canvas id="bg"></canvas>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('bg'), alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const starsGeometry = new THREE.BufferGeometry();
const starCount = 3000;
const positions = [];
for (let i = 0; i < starCount; i++) {
    positions.push((Math.random() - 0.5) * 2000);
    positions.push((Math.random() - 0.5) * 2000);
    positions.push((Math.random() - 0.5) * 2000);
}
starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
const starsMaterial = new THREE.PointsMaterial({color: 0xffffff});
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

camera.position.z = 500;
function animate() {
    requestAnimationFrame(animate);
    stars.rotation.x += 0.0005;
    stars.rotation.y += 0.0005;
    renderer.render(scene, camera);
}
animate();
</script>
"""
components.v1.html(threejs, height=0)
