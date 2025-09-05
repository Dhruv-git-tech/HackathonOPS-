"""
NexusTask - Streamlit port (single-file)

How to run
1. Install dependencies:
   pip install streamlit plotly pandas python-dateutil

2. Run:
   streamlit run nexustask_streamlit_app.py

Notes
- This app uses a local SQLite DB (file: nexustask.db) for persistence.
- Gemini breakdown is implemented but requires you to set GENERATIVE_API_KEY environment variable
  or paste it into the appropriate input. The code endpoint is left as a placeholder.
- The 3D background is embedded using streamlit.components.v1.html with three.js included.

This file attempts to recreate the core UI/UX and features of your HTML/JS demo:
- Login (mock users seeded)
- Role-based dashboards: admin, team_head, team_member
- Task create/edit, mark complete
- Charts (Plotly)
- Activity heatmap (simple)
- Gemini "Break Down Task" button (calls generative API if key provided)

"""

import streamlit as st
import sqlite3
from sqlite3 import Connection
import pandas as pd
import plotly.express as px
from datetime import datetime, timedelta
import uuid
import os
import json
import requests
from dateutil import parser
import streamlit.components.v1 as components

DB_PATH = "nexustask.db"

# ----------------- Database utilities -----------------

def get_conn() -> Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(conn: Connection):
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            name TEXT,
            role TEXT,
            team_id INTEGER,
            email TEXT UNIQUE,
            password TEXT
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            status TEXT,
            assigned_to TEXT,
            team_id INTEGER,
            deadline TEXT,
            completed_at TEXT
        )
    ''')
    conn.commit()


def seed_mock_data(conn: Connection):
    cur = conn.cursor()
    # Check if data exists
    cur.execute("SELECT COUNT(*) as c FROM profiles")
    if cur.fetchone()[0] > 0:
        return

    # Seed teams
    cur.execute("INSERT INTO teams (id, name) VALUES (?,?)", (1, 'Team Brahmastra'))
    cur.execute("INSERT INTO teams (id, name) VALUES (?,?)", (2, 'Team Vayu'))

    profiles = [
        ('uuid-admin-aditya', 'Aditya Sharma', 'admin', None, 'admin@test.com', 'admin'),
        ('uuid-head-priya', 'Priya Patel', 'team_head', 1, 'priya@test.com', 'password'),
        ('uuid-member-rohan', 'Rohan Mehta', 'team_member', 1, 'rohan@test.com', 'password'),
        ('uuid-member-ananya', 'Ananya Iyer', 'team_member', 1, 'ananya@test.com', 'password'),
        ('uuid-head-vikram', 'Vikram Singh', 'team_head', 2, 'vikram@test.com', 'password'),
        ('uuid-member-isha', 'Isha Gupta', 'team_member', 2, 'isha@test.com', 'password'),
    ]
    for p in profiles:
        cur.execute("INSERT INTO profiles (id,name,role,team_id,email,password) VALUES (?,?,?,?,?,?)", p)

    tasks = [
        ('Develop Q1 Marketing Strategy', 'Plan social media campaigns and outreach programs.', 'inprogress', 'uuid-head-priya', 1, '2025-10-15T00:00:00Z', None),
        ('Finalize UI/UX for new app', 'Incorporate feedback from beta testers.', 'pending', 'uuid-member-rohan', 1, '2025-09-20T00:00:00Z', None),
        ('Write documentation for API', 'Cover all endpoints and provide examples.', 'completed', 'uuid-member-ananya', 1, '2025-09-01T00:00:00Z', '2025-08-30T00:00:00Z'),
        ('Server infrastructure upgrade', 'Migrate services to the new cloud provider.', 'inprogress', 'uuid-head-vikram', 2, '2025-09-30T00:00:00Z', None),
        ('Customer feedback analysis', 'Compile a report on feedback from the last month.', 'pending', 'uuid-member-isha', 2, '2025-09-25T00:00:00Z', None),
        ('Test new feature deployment', 'Ensure no bugs in production.', 'completed', 'uuid-member-isha', 2, '2025-08-28T00:00:00Z', '2025-08-28T00:00:00Z')
    ]
    for t in tasks:
        cur.execute("INSERT INTO tasks (title,description,status,assigned_to,team_id,deadline,completed_at) VALUES (?,?,?,?,?,?,?)", t)

    conn.commit()

# ----------------- Helpers -----------------

def to_iso_date(date_str: str) -> str:
    # Accepts yyyy-mm-dd or iso strings
    if not date_str:
        return None
    try:
        d = parser.parse(date_str)
        return d.isoformat()
    except Exception:
        return date_str


def show_compliment():
    compliments = ["Stellar work!", "Mission accomplished!", "Future is built on tasks like these!", "Incredible efficiency!", "Another one bites the dust!"]
    st.toast = st.experimental_rerun  # placeholder to hint state change
    st.success(compliments[int(uuid.uuid4().int % len(compliments))])

# ----------------- Gemini Breakdown -----------------

def gemini_breakdown(task_title: str, api_key: str) -> str:
    if not api_key:
        return "(Provide an API key in Settings to use AI breakdown.)"

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key={api_key}"
    system_prompt = f"You are an expert project manager. Break down the following high-level task into a concise, actionable description for a team member in India. The task is: '{task_title}'. Provide a short paragraph describing the goal, followed by a bulleted or numbered list of key sub-tasks or action items. Use markdown for the list."
    payload = {"contents": [{"parts": [{"text": system_prompt}]}]}

    try:
        r = requests.post(api_url, json=payload, timeout=15)
        r.raise_for_status()
        data = r.json()
        candidate = data.get('candidates', [{}])[0]
        text = candidate.get('content', {}).get('parts', [{}])[0].get('text')
        return text or "AI returned no text."
    except Exception as e:
        return f"AI call failed: {e}"

# ----------------- UI Components -----------------

def threejs_background():
    # Embed the three.js starfield in a fixed canvas
    html = '''
    <style>
      body { margin:0; }
      #bg-canvas { position: fixed; left:0; top:0; width:100%; height:100%; z-index:-1; }
    </style>
    <canvas id="bg-canvas"></canvas>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
      (function(){
        let scene = new THREE.Scene();
        let camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 1000);
        camera.position.z = 1;
        camera.rotation.x = Math.PI/2;
        let renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg-canvas'), alpha:true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        const starGeo = new THREE.BufferGeometry();
        const starCount = 3000;
        const posArray = new Float32Array(starCount*3);
        for(let i=0;i<starCount*3;i++){ posArray[i] = (Math.random()-0.5)*5; }
        starGeo.setAttribute('position', new THREE.BufferAttribute(posArray,3));
        const starMaterial = new THREE.PointsMaterial({ color:0xaaaaaa, size:0.005, transparent:true });
        const stars = new THREE.Points(starGeo, starMaterial);
        scene.add(stars);
        function onResize(){ camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth,window.innerHeight); }
        window.addEventListener('resize', onResize);
        let mouseX=0, mouseY=0;
        document.addEventListener('mousemove', (e)=>{ mouseX=e.clientX; mouseY=e.clientY; stars.position.x = (mouseX - window.innerWidth/2)*0.00005; stars.position.y = (mouseY - window.innerHeight/2)*-0.00005; });
        function animate(){ stars.rotation.y += 0.0002; renderer.render(scene,camera); requestAnimationFrame(animate); }
        animate();
      })();
    </script>
    '''
    components.html(html, height=1, scrolling=False)

# ----------------- Main App -----------------

def main():
    st.set_page_config(page_title='NexusTask - Streamlit', layout='wide')
    threejs_background()

    conn = get_conn()
    init_db(conn)
    seed_mock_data(conn)

    if 'user' not in st.session_state:
        st.session_state['user'] = None

    # Top bar
    col1, col2 = st.columns([3,1])
    with col1:
        st.markdown("<h1 style='font-family:Orbitron,Roboto, sans-serif; color:#fff'>NexusTask</h1>", unsafe_allow_html=True)
        st.markdown("<p style='color:#cbd5e1'>The Future of Team Collaboration</p>", unsafe_allow_html=True)
    with col2:
        if st.session_state['user']:
            st.write(f"**{st.session_state['user']['name']}**")
            if st.button('Logout'):
                st.session_state['user'] = None
                st.experimental_rerun()

    # If not logged in, show login
    if not st.session_state['user']:
        login_form(conn)
        return

    # Settings area
    with st.expander('Settings / API keys', expanded=False):
        api_key = st.text_input('Generative API Key (optional)', value=os.getenv('GENERATIVE_API_KEY', ''), type='password')
        st.session_state['gen_api_key'] = api_key

    # Route to role-based dashboards
    role = st.session_state['user']['role']
    if role == 'admin':
        admin_dashboard(conn)
    elif role == 'team_head':
        team_head_dashboard(conn)
    else:
        team_member_dashboard(conn)

# ----------------- Login -----------------

def login_form(conn: Connection):
    st.markdown('### Access Nexus')
    with st.form('login'):
        email = st.text_input('Email')
        password = st.text_input('Password', type='password')
        submitted = st.form_submit_button('Access Nexus')
        if submitted:
            cur = conn.cursor()
            cur.execute('SELECT * FROM profiles WHERE email=? AND password=?', (email, password))
            row = cur.fetchone()
            if row:
                st.session_state['user'] = dict(row)
                st.experimental_rerun()
            else:
                st.error('Invalid credentials. Try admin@test.com / admin')

# ----------------- Admin -----------------

def admin_dashboard(conn: Connection):
    st.markdown('## Admin Control Deck')
    cur = conn.cursor()
    cur.execute('SELECT * FROM tasks')
    tasks = [dict(r) for r in cur.fetchall()]
    cur.execute('SELECT * FROM profiles')
    profiles = [dict(r) for r in cur.fetchall()]
    cur.execute('SELECT * FROM teams')
    teams = [dict(r) for r in cur.fetchall()]

    # Stats
    total = len(tasks)
    completed = len([t for t in tasks if t['status']=='completed'])
    inprogress = len([t for t in tasks if t['status']=='inprogress'])
    active_members = len([p for p in profiles if p['role']!='admin'])

    c1, c2, c3, c4 = st.columns(4)
    c1.metric('Total Tasks', total)
    c2.metric('Completed', completed)
    c3.metric('In Progress', inprogress)
    c4.metric('Active Members', active_members)

    # Charts
    with st.container():
        colA, colB = st.columns([2,1])
        with colA:
            df = pd.DataFrame({'status':['completed','inprogress','pending'], 'count':[completed, inprogress, total-completed-inprogress]})
            fig = px.pie(df, names='status', values='count', title='Task Completion Rate')
            st.plotly_chart(fig, use_container_width=True)
        with colB:
            team_data = []
            for t in teams:
                c = len([x for x in tasks if x['team_id']==t['id'] and x['status']=='completed'])
                team_data.append({'team':t['name'],'completed':c})
            df2 = pd.DataFrame(team_data)
            fig2 = px.bar(df2, x='completed', y='team', orientation='h', title='Team Performance')
            st.plotly_chart(fig2, use_container_width=True)

    # Teams and tasks view
    st.markdown('### All Teams and Tasks')
    if st.button('Add Task'):
        open_task_modal(conn)

    for team in teams:
        st.markdown(f"#### {team['name']}")
        members = [p for p in profiles if p['team_id']==team['id']]
        head = next((m for m in members if m['role']=='team_head'), None)
        st.caption(f"Lead: {head['name'] if head else 'N/A'}")
        for m in members:
            st.markdown(f"**{m['name']}**")
            member_tasks = [t for t in tasks if t['assigned_to']==m['id']]
            if not member_tasks:
                st.info('No tasks assigned.')
            else:
                for t in member_tasks:
                    task_card_ui(conn, t, allow_edit=True)

# ----------------- Team Head -----------------

def team_head_dashboard(conn: Connection):
    user = st.session_state['user']
    st.markdown('## Team Command Center')
    cur = conn.cursor()
    cur.execute('SELECT * FROM tasks WHERE assigned_to=?', (user['id'],))
    my_tasks = [dict(r) for r in cur.fetchall()]
    st.markdown('### My Personal Tasks')
    if not my_tasks:
        st.info('You have no personal tasks.')
    else:
        for t in my_tasks:
            task_card_ui(conn, t)

    st.markdown('### My Activity Heatmap')
    create_heatmap(conn, user['id'])

    st.markdown('### My Team\'s Progress')
    cur.execute('SELECT * FROM profiles WHERE team_id=? AND id!=?', (user['team_id'], user['id']))
    members = [dict(r) for r in cur.fetchall()]
    for m in members:
        st.markdown(f"**{m['name']}**")
        cur.execute('SELECT * FROM tasks WHERE assigned_to=?', (m['id'],))
        mem_tasks = [dict(r) for r in cur.fetchall()]
        if not mem_tasks:
            st.info('No tasks assigned.')
        else:
            for t in mem_tasks:
                task_card_ui(conn, t)

# ----------------- Team Member -----------------

def team_member_dashboard(conn: Connection):
    user = st.session_state['user']
    st.markdown('## My Task Interface')
    cur = conn.cursor()
    cur.execute('SELECT * FROM tasks WHERE assigned_to=?', (user['id'],))
    my_tasks = [dict(r) for r in cur.fetchall()]
    st.markdown('### Assigned Tasks')
    if not my_tasks:
        st.success('You have no tasks assigned. Great job!')
    else:
        for t in my_tasks:
            task_card_ui(conn, t)

    st.markdown('### My Activity Heatmap')
    create_heatmap(conn, user['id'])

# ----------------- Task UI -----------------

def task_card_ui(conn: Connection, task: dict, allow_edit=False):
    status_colors = {'pending':'#facc15', 'inprogress':'#3b82f6', 'completed':'#22c55e'}
    col1, col2 = st.columns([3,1])
    with col1:
        st.markdown(f"**{task['title']}**")
        st.write(task['description'])
        dl = task['deadline']
        if dl:
            try:
                dl_disp = parser.parse(dl).date().isoformat()
            except Exception:
                dl_disp = dl
            st.caption(f"Deadline: {dl_disp}")
        if task['status']=='completed' and task['completed_at']:
            st.caption(f"Completed: {parser.parse(task['completed_at']).date().isoformat()}")
    with col2:
        st.markdown(f"<div style='text-align:right'><b style='color:{status_colors.get(task['status'],'#fff')}'>{task['status'].upper()}</b></div>", unsafe_allow_html=True)
        if task['status']!='completed':
            if st.button('Mark Complete', key=f"complete-{task['id']}"):
                cur = conn.cursor()
                cur.execute('UPDATE tasks SET status=?, completed_at=? WHERE id=?', ('completed', datetime.utcnow().isoformat(), task['id']))
                conn.commit()
                st.experimental_rerun()
        if allow_edit and st.button('Edit Task', key=f"edit-{task['id']}"):
            open_task_modal(conn, task)

# ----------------- Task Modal (via st.form) -----------------

def open_task_modal(conn: Connection, task: dict = None):
    profiles = [dict(r) for r in conn.cursor().execute('SELECT * FROM profiles WHERE role != "admin"').fetchall()]
    with st.form('task_form'):
        if task:
            st.markdown('### Edit Task')
            title = st.text_input('Title', value=task['title'])
            description = st.text_area('Description', value=task['description'])
            assignee = st.selectbox('Assign To', options=[p['id'] for p in profiles], format_func=lambda pid: next(p['name'] for p in profiles if p['id']==pid), index=next(i for i,p in enumerate(profiles) if p['id']==task['assigned_to']))
            deadline = st.date_input('Deadline', value=parser.parse(task['deadline']).date() if task['deadline'] else datetime.utcnow().date())
            status = st.selectbox('Status', ['pending','inprogress','completed'], index=['pending','inprogress','completed'].index(task['status']))
        else:
            st.markdown('### Create New Task')
            title = st.text_input('Title')
            description = st.text_area('Description')
            assignee = st.selectbox('Assign To', options=[p['id'] for p in profiles], format_func=lambda pid: next(p['name'] for p in profiles if p['id']==pid))
            deadline = st.date_input('Deadline', value=datetime.utcnow().date())
            status = st.selectbox('Status', ['pending','inprogress','completed'])

        col1, col2 = st.columns([1,1])
        with col1:
            if st.form_submit_button('Save Task'):
                assignee_profile = next(p for p in profiles if p['id']==assignee)
                task_payload = (title, description, status, assignee, assignee_profile['team_id'], datetime.combine(deadline, datetime.min.time()).isoformat())
                cur = conn.cursor()
                if task:
                    cur.execute('UPDATE tasks SET title=?,description=?,status=?,assigned_to=?,team_id=?,deadline=? WHERE id=?', (*task_payload, task['id']))
                else:
                    cur.execute('INSERT INTO tasks (title,description,status,assigned_to,team_id,deadline,completed_at) VALUES (?,?,?,?,?,?,?)', (*task_payload, None))
                conn.commit()
                st.experimental_rerun()
        with col2:
            # Gemini breakdown
            if st.button('✨ Break Down Task (AI)'):
                api_key = st.session_state.get('gen_api_key','')
                breakdown = gemini_breakdown(title or task.get('title',''), api_key)
                st.markdown('**AI Breakdown:**')
                st.markdown(breakdown)

# ----------------- Heatmap -----------------

def create_heatmap(conn: Connection, user_id: str):
    cur = conn.cursor()
    cur.execute('SELECT * FROM tasks WHERE assigned_to=? AND status="completed"', (user_id,))
    rows = [dict(r) for r in cur.fetchall()]
    contributions = {}
    for r in rows:
        if not r['completed_at']:
            continue
        d = parser.parse(r['completed_at']).date().isoformat()
        contributions[d] = contributions.get(d,0) + 1

    today = datetime.utcnow().date()
    cells = []
    for i in range(182, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        c = contributions.get(d,0)
        if c==0:
            color = '#1f2937'
        elif c==1:
            color = '#2dd4bf'
        elif c==2:
            color = '#06b6d4'
        else:
            color = '#0891b2'
        cells.append(f"<div title='{c} tasks on {d}' style='width:10px;height:10px;margin:1px;border-radius:2px;background:{color};display:inline-block'></div>")
    html = "".join(cells)
    st.markdown(f"<div style='display:flex;flex-wrap:wrap;width:560px'>{html}</div>", unsafe_allow_html=True)

# ----------------- Entrypoint -----------------

if __name__ == '__main__':
    main()
