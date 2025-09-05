import streamlit as st
import plotly.express as px
import streamlit.components.v1 as components

# ---------------- MOCK DATA ---------------- #
USERS = {
    "admin": {"password": "123", "role": "Admin"},
    "head": {"password": "123", "role": "Team Head"},
    "member": {"password": "123", "role": "Team Member"},
}

TASKS = [
    {"id": 1, "title": "Design UI", "status": "Pending", "assigned_to": "member"},
    {"id": 2, "title": "Backend API", "status": "In Progress", "assigned_to": "head"},
    {"id": 3, "title": "Testing", "status": "Completed", "assigned_to": "member"},
]

STATUS_COLORS = {"Pending": "#FFD700", "In Progress": "#1E90FF", "Completed": "#32CD32"}

# ---------------- PAGE CONFIG ---------------- #
st.set_page_config(page_title="Nexus Task Manager", layout="wide")

# Inject custom CSS
st.markdown(
    """
    <style>
    body {
        background: transparent;
        color: #E0E0E0;
        font-family: 'Segoe UI', sans-serif;
    }
    .task-card {
        background: rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: 16px;
        margin: 10px 0;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        backdrop-filter: blur(12px);
    }
    .status-badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: bold;
        color: black;
    }
    .title {
        text-align: center;
        font-size: 2em;
        font-weight: bold;
        margin-bottom: 10px;
        color: #00E5FF;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------- STARFIELD BACKGROUND ---------------- #
starfield_html = """
<canvas id="stars"></canvas>
<script>
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let stars = [];
  for (let i=0;i<200;i++){
    stars.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*2});
  }
  function drawStars(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="white";
    stars.forEach(s=>{
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fill();
    });
  }
  setInterval(drawStars,50);
</script>
<style>
#stars {
  position: fixed;
  top:0; left:0;
  width:100%; height:100%;
  z-index:-1;
  background:black;
}
</style>
"""
components.html(starfield_html, height=0, width=0)

# ---------------- LOGIN ---------------- #
if "user" not in st.session_state:
    st.session_state.user = None

if not st.session_state.user:
    st.markdown("<div class='title'>🌌 Nexus Task Manager</div>", unsafe_allow_html=True)
    username = st.text_input("Username")
    password = st.text_input("Password", type="password")
    if st.button("Login"):
        if username in USERS and USERS[username]["password"] == password:
            st.session_state.user = {"name": username, "role": USERS[username]["role"]}
            st.rerun()
        else:
            st.error("Invalid username or password")
    st.stop()

# ---------------- DASHBOARD ---------------- #
user = st.session_state.user
st.markdown(f"<div class='title'>Welcome, {user['role']}</div>", unsafe_allow_html=True)

# Filter tasks for role
if user["role"] == "Team Member":
    visible_tasks = [t for t in TASKS if t["assigned_to"] == user["name"]]
else:
    visible_tasks = TASKS

# Task cards
st.subheader("📋 Tasks")
for t in visible_tasks:
    color = STATUS_COLORS[t["status"]]
    st.markdown(
        f"""
        <div class="task-card">
            <b>{t['title']}</b><br>
            <span class="status-badge" style="background:{color}">{t['status']}</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

# Chart
st.subheader("📊 Task Status Overview")
df = {s: sum(1 for t in TASKS if t["status"] == s) for s in STATUS_COLORS}
fig = px.pie(
    names=list(df.keys()),
    values=list(df.values()),
    color=list(df.keys()),
    color_discrete_map=STATUS_COLORS,
    title="Tasks by Status",
)
st.plotly_chart(fig, use_container_width=True)

# Logout
if st.button("Logout"):
    st.session_state.user = None
    st.rerun()
