# Project Context: interviewMentor

- Generated: 2026-06-19T11:20:37.079Z
- Source path: F:\AI\interviewMentor
- Files included: 29
- Files skipped (> 250 KB): 0

## Detected stack & packages

### npm - client\package.json
**name** interview-mentor-client
**dependencies**
- react ^18.3.1
- react-dom ^18.3.1
- react-router-dom ^6.26.0
**devDependencies**
- @vitejs/plugin-react ^4.7.0
- vite ^6.4.3
### npm - server\package.json
**name** interview-mentor-server
**dependencies**
- @supabase/supabase-js ^2.45.0
- cors ^2.8.5
- dotenv ^16.4.5
- express ^4.19.2

## File type breakdown

- .js: 11
- .jsx: 9
- .json: 4
- (none): 1
- .html: 1
- .css: 1
- .md: 1
- .sql: 1

## File tree

```
|-- .gitignore
|-- README.md
|-- client
|   |-- index.html
|   |-- package.json
|   |-- src
|   |   |-- App.jsx
|   |   |-- api.js
|   |   |-- components
|   |   |   `-- States.jsx
|   |   |-- main.jsx
|   |   |-- pages
|   |   |   |-- Applications.jsx
|   |   |   |-- Progress.jsx
|   |   |   |-- Questions.jsx
|   |   |   |-- Roadmap.jsx
|   |   |   |-- Speaking.jsx
|   |   |   `-- Today.jsx
|   |   `-- styles.css
|   `-- vite.config.js
`-- server
    |-- db
    |   `-- schema.sql
    |-- package.json
    `-- src
        |-- data
        |   |-- roadmap.json
        |   `-- taskBank.json
        |-- groq.js
        |-- index.js
        |-- notion.js
        |-- planner.js
        |-- routes
        |   |-- ai.js
        |   |-- data.js
        |   `-- today.js
        |-- setup-notion.js
        `-- supabase.js
```

## Source files

### .gitignore

````
# dependencies
node_modules/
**/node_modules/
# build output
dist/
**/dist/
# env / secrets
.env
.env.local
**/.env
**/.env.local
# logs / os
*.log
.DS_Store

````

### client\index.html

````html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mentor — daily prep</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

````

### client\package.json

````json
{
  "name": "interview-mentor-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.7.0",
    "vite": "^6.4.3"
  }
}

````

### client\src\api.js

````javascript
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const PASSCODE = import.meta.env.VITE_APP_PASSCODE || '';

async function req(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-app-passcode': PASSCODE
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (e) {
    console.error('[api] backend request failed', e);
    throw new Error(`Could not reach the backend at ${BASE}. Start the server and check VITE_API_URL.`);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || `Request failed (${res.status})`;
    console.error('[api] request failed', { path, status: res.status, message });
    throw new Error(message);
  }
  return data;
}

export const api = {
  health: () => req('/api/health'),

  // today
  getToday: (date) => req('/api/today' + (date ? `?date=${date}` : '')),
  toggleTask: (id) => req(`/api/task/${id}/toggle`, { method: 'POST' }),
  setMode: (date, mode) => req('/api/day/mode', { method: 'POST', body: { date, mode } }),
  saveLog: (body) => req('/api/log', { method: 'POST', body }),
  setStatus: (date, status) => req('/api/day/status', { method: 'POST', body: { date, status } }),

  // ai
  replan: (body) => req('/api/ai/replan', { method: 'POST', body }),
  sendNote: (body) => req('/api/ai/note', { method: 'POST', body }),
  getNotes: () => req('/api/ai/notes'),
  mock: (body) => req('/api/ai/mock', { method: 'POST', body }),

  // data
  roadmap: () => req('/api/roadmap'),
  progress: () => req('/api/progress'),
  list: (table) => req(`/api/${table}`),
  create: (table, body) => req(`/api/${table}`, { method: 'POST', body }),
  update: (table, id, body) => req(`/api/${table}/${id}`, { method: 'PUT', body }),
  remove: (table, id) => req(`/api/${table}/${id}`, { method: 'DELETE' })
};

````

### client\src\App.jsx

````jsx
import { useEffect, useState } from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import Today from './pages/Today.jsx';
import Roadmap from './pages/Roadmap.jsx';
import Questions from './pages/Questions.jsx';
import Applications from './pages/Applications.jsx';
import Speaking from './pages/Speaking.jsx';
import Progress from './pages/Progress.jsx';
import { api } from './api.js';

const tabs = [
  ['/', 'Today'],
  ['/roadmap', 'Roadmap'],
  ['/questions', 'Questions'],
  ['/applications', 'Applications'],
  ['/speaking', 'Speaking'],
  ['/progress', 'Progress']
];

function SetupStatus() {
  const [state, setState] = useState({ status: 'checking', message: 'Checking backend...' });

  useEffect(() => {
    let active = true;
    api.health()
      .then((health) => {
        if (!active) return;
        if (!health.config?.database) {
          setState({ status: 'warn', message: 'Database setup needed: add Supabase keys in server/.env.' });
          return;
        }
        if (!health.config?.ai) {
          setState({ status: 'soft', message: 'Core app ready. Add GROQ_API_KEY later to enable AI coaching.' });
          return;
        }
        setState({ status: 'ok', message: 'Backend connected.' });
      })
      .catch((e) => {
        if (!active) return;
        setState({ status: 'bad', message: e.message });
      });
    return () => { active = false; };
  }, []);

  return (
    <div className={`setup-status ${state.status}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>{state.message}</span>
    </div>
  );
}

export default function App() {
  return (
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          <span className="lamp" />
          <b>Mentor</b>
          <span>your daily prep, one screen</span>
        </div>
      </div>
      <SetupStatus />

      <nav className="tabs">
        {tabs.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'active' : ''}>
            {label}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/speaking" element={<Speaking />} />
        <Route path="/progress" element={<Progress />} />
      </Routes>
    </div>
  );
}

````

### client\src\components\States.jsx

````jsx
export function LoadingState({ children = 'Loading...' }) {
  return (
    <div className="state-card">
      <span className="spinner" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, hint, onRetry }) {
  return (
    <div className="card state-panel">
      <div className="error-title">{title}</div>
      {message && <p className="muted">{message}</p>}
      {hint && <p className="faint">{hint}</p>}
      {onRetry && (
        <div className="error-actions">
          <button className="btn sm" onClick={onRetry}>Retry</button>
        </div>
      )}
    </div>
  );
}

export function InlineNotice({ tone = 'info', children }) {
  return <div className={`notice ${tone}`}>{children}</div>;
}

````

### client\src\main.jsx

````jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

````

### client\src\pages\Applications.jsx

````jsx
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorState, LoadingState } from '../components/States.jsx';

const STATUSES = ['Applied', 'Screen', 'Tech', 'Final', 'Offer', 'Rejected'];
const SOURCES = ['LinkedIn', 'Naukri', 'Instahyre', 'Wellfound', 'Referral', 'Career page'];

export default function Applications() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ company: '', role: '', location: '', source: 'LinkedIn', stack: '' });

  async function load() {
    try {
      setErr('');
      setLoading(true);
      const r = await api.list('applications');
      setItems(r.items);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!form.company.trim()) return;
    try { await api.create('applications', form); setForm({ company: '', role: '', location: '', source: form.source, stack: '' }); load(); } catch (e) { setErr(e.message); }
  }
  async function cycle(a) {
    const next = STATUSES[(STATUSES.indexOf(a.status) + 1) % STATUSES.length];
    setItems(items.map(i => i.id === a.id ? { ...i, status: next } : i));
    try { await api.update('applications', a.id, { status: next }); } catch (e) { setErr(e.message); }
  }
  async function del(id) { try { await api.remove('applications', id); load(); } catch (e) { setErr(e.message); } }

  const counts = STATUSES.map(s => ({ s, n: items.filter(i => i.status === s).length }));

  if (loading) return <LoadingState>Loading applications...</LoadingState>;
  if (err && items.length === 0) {
    return (
      <ErrorState
        title="Applications need the database"
        message={err}
        hint="Add Supabase credentials in server/.env, then restart the backend."
        onRetry={load}
      />
    );
  }

  return (
    <div className="fade-in">
      <h2 className="section-title">Applications</h2>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row">
          {counts.map(c => <span key={c.s} className="pill">{c.s}: {c.n}</span>)}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <input placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          <input placeholder="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
        </div>
        <div className="row" style={{ marginBottom: 8 }}>
          <input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} style={{ width: 'auto' }}>
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <input placeholder="Stack (optional)" value={form.stack} onChange={e => setForm({ ...form, stack: e.target.value })} />
        <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={add}>Add application</button></div>
      </div>

      {err && <div className="error">{err}</div>}

      {items.map(a => (
        <div key={a.id} className="list-item">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <b>{a.company}</b> <span className="muted">- {a.role || 'role n/a'}</span>
              <div className="faint" style={{ marginTop: 3 }}>{[a.location, a.source, a.stack].filter(Boolean).join(' - ')}</div>
            </div>
            <button className="chip sm" onClick={() => cycle(a)}>{a.status}</button>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn sm ghost" onClick={() => del(a.id)} style={{ color: 'var(--faint)' }}>Delete</button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="center-note">No applications yet. Start light after week 3, serious after week 6.</p>}
    </div>
  );
}

````

### client\src\pages\Progress.jsx

````jsx
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorState, LoadingState } from '../components/States.jsx';

export default function Progress() {
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');

  async function load() {
    try {
      setErr('');
      setP(await api.progress());
    } catch (e) {
      setErr(e.message);
    }
  }
  useEffect(() => { load(); }, []);

  if (err) {
    return (
      <ErrorState
        title="Progress needs the database"
        message={err}
        hint="Progress is calculated from Supabase days, tasks, questions, and applications."
        onRetry={load}
      />
    );
  }
  if (!p) return <LoadingState>Loading progress...</LoadingState>;

  const recent = (p.series || []).slice(-28);
  const maxPts = 3;

  return (
    <div className="fade-in">
      <h2 className="section-title">Progress</h2>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="label-row"><h3>Last weeks</h3><span className="faint">amber = full - green = normal - dim = low</span></div>
        {recent.length === 0
          ? <p className="muted">No days logged yet. Close your first day on the Today tab.</p>
          : <div className="bars">
              {recent.map((s, i) => (
                <div key={i} className={`bar ${s.points > 0 ? s.mode : ''}`}
                  style={{ height: `${Math.max(s.points / maxPts * 100, 4)}%` }}
                  title={`${s.date}: ${s.status} (${s.points} pts)`} />
              ))}
            </div>}
      </div>

      <div className="stat-grid">
        <div className="stat"><div className="n" style={{ color: 'var(--sage)' }}>{p.streak}</div><div className="k">current chain (days)</div></div>
        <div className="stat"><div className="n" style={{ color: 'var(--amber)' }}>{p.totalPoints}</div><div className="k">total points</div></div>
        <div className="stat"><div className="n">{p.daysEngaged}</div><div className="k">days kept alive</div></div>
        <div className="stat"><div className="n">{p.canAnswer}/{p.questionsCount}</div><div className="k">questions you can answer</div></div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <p className="muted" style={{ margin: 0 }}>Weekly target: 8 points minimum, 12 good, 16+ excellent. Full day = 3, normal = 2, low = 1. Uneven days are fine. Disappearing for many days is the only real failure.</p>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted">Applications in flight</span>
          <b style={{ fontFamily: 'var(--display)', fontSize: 18 }}>{p.applications}</b>
        </div>
      </div>
    </div>
  );
}

````

### client\src\pages\Questions.jsx

````jsx
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorState, LoadingState } from '../components/States.jsx';

const STATUSES = ['New', 'Learning', 'Can Answer', 'Mock Passed'];
const TOPICS = ['C#', '.NET', 'SQL', 'DSA', 'Azure', 'AI', 'React', 'Angular', 'Behavioral', 'Project'];

export default function Questions() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ topic: 'C#', difficulty: 'Easy', question: '' });
  const [open, setOpen] = useState(null);
  const [answers, setAnswers] = useState({});

  async function load() {
    try {
      setErr('');
      setLoading(true);
      const r = await api.list('questions');
      setItems(r.items);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!form.question.trim()) return;
    try { await api.create('questions', form); setForm({ ...form, question: '' }); load(); } catch (e) { setErr(e.message); }
  }
  async function cycleStatus(q) {
    const next = STATUSES[(STATUSES.indexOf(q.status) + 1) % STATUSES.length];
    setItems(items.map(i => i.id === q.id ? { ...i, status: next } : i));
    try { await api.update('questions', q.id, { status: next }); } catch (e) { setErr(e.message); }
  }
  async function saveAnswer(q, my_answer) {
    try { await api.update('questions', q.id, { my_answer, last_practiced: new Date().toISOString().slice(0, 10) }); load(); } catch (e) { setErr(e.message); }
  }
  async function del(id) { try { await api.remove('questions', id); load(); } catch (e) { setErr(e.message); } }

  function toggleAnswer(q) {
    setOpen(open === q.id ? null : q.id);
    setAnswers(prev => ({ ...prev, [q.id]: prev[q.id] ?? q.my_answer ?? '' }));
  }

  if (loading) return <LoadingState>Loading question bank...</LoadingState>;
  if (err && items.length === 0) {
    return (
      <ErrorState
        title="Question bank needs the database"
        message={err}
        hint="Add Supabase credentials in server/.env, then restart the backend."
        onRetry={load}
      />
    );
  }

  return (
    <div className="fade-in">
      <h2 className="section-title">Question bank</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <select value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} style={{ width: 'auto', flex: 1 }}>
            {TOPICS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} style={{ width: 'auto' }}>
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
        </div>
        <input placeholder="Add a question you got asked or fear..." value={form.question}
          onChange={e => setForm({ ...form, question: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && add()} />
        <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={add}>Add question</button></div>
      </div>

      {err && <div className="error">{err}</div>}

      {items.map(q => (
        <div key={q.id} className="list-item">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <span className="pill" style={{ marginRight: 8 }}>{q.topic}</span>
              <span className="faint">{q.difficulty}</span>
              <div style={{ marginTop: 6, fontWeight: 500 }}>{q.question}</div>
            </div>
            <button className="chip sm" onClick={() => cycleStatus(q)} title="Click to advance">{q.status}</button>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn sm ghost" onClick={() => toggleAnswer(q)}>{open === q.id ? 'Hide' : 'My answer'}</button>
            <button className="btn sm ghost" onClick={() => del(q.id)} style={{ color: 'var(--faint)' }}>Delete</button>
          </div>
          {open === q.id && (
            <div style={{ marginTop: 10 }}>
              <textarea
                value={answers[q.id] ?? ''}
                placeholder="Write your answer in your own words..."
                onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              />
              <button className="btn sm" style={{ marginTop: 8 }}
                onClick={() => saveAnswer(q, answers[q.id] ?? '')}>Save answer</button>
            </div>
          )}
        </div>
      ))}
      {items.length === 0 && <p className="center-note">No questions yet. Add the ones that scare you most.</p>}
    </div>
  );
}

````

### client\src\pages\Roadmap.jsx

````jsx
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorState, LoadingState } from '../components/States.jsx';

export default function Roadmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  async function load() {
    try {
      setErr('');
      setData(await api.roadmap());
    } catch (e) {
      setErr(e.message);
    }
  }
  useEffect(() => { load(); }, []);

  if (err) return <ErrorState title="Could not load roadmap" message={err} onRetry={load} />;
  if (!data) return <LoadingState>Loading roadmap...</LoadingState>;

  return (
    <div className="fade-in">
      <h2 className="section-title">The 90-day spine</h2>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="eyebrow">Days 1–14</div>
        <p className="muted" style={{ marginTop: 6 }}>Rehabilitation. Restart your hands and your voice — C# basics, SQL basics, JS basics, first mock. Do not judge yourself in these two weeks.</p>
      </div>

      {data.phases.map(p => (
        <div key={p.week} className="list-item">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b style={{ fontFamily: 'var(--display)' }}>Week {p.week} — {p.name}</b>
            <span className="pill">Day {p.startDay}–{p.endDay}</span>
          </div>
          <p className="muted" style={{ margin: '6px 0 0' }}>{p.focus}</p>
        </div>
      ))}

      <h2 className="section-title" style={{ marginTop: 26 }}>Rules before motivation</h2>
      <div className="card">
        {data.consistencyRules.map((r, i) => (
          <p key={i} className="muted" style={{ margin: i ? '10px 0 0' : 0 }}>- {r}</p>
        ))}
      </div>
    </div>
  );
}

````

### client\src\pages\Speaking.jsx

````jsx
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorState, LoadingState } from '../components/States.jsx';

const PROMPTS = ['Tell me about yourself', 'Why are you looking for change?', 'Explain a project (STAR)', 'Explain a technical concept', 'What if you do not know?'];

export default function Speaking() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ prompt: PROMPTS[0], duration_s: 75, clarity: 3, pace: 3, confidence: 3, one_fix: '' });
  const [mock, setMock] = useState(null);
  const [mockBusy, setMockBusy] = useState(false);

  async function load() {
    try {
      setErr('');
      setLoading(true);
      const r = await api.list('recordings');
      setItems(r.items);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function add() {
    try { await api.create('recordings', form); setForm({ ...form, one_fix: '' }); load(); } catch (e) { setErr(e.message); }
  }
  async function runMock() {
    setMockBusy(true); setMock(null);
    try { setMock(await api.mock({})); } catch (e) { setErr(e.message); }
    setMockBusy(false);
  }

  const Scale = ({ k, label }) => (
    <div className="row" style={{ marginBottom: 6 }}>
      <span className="faint" style={{ width: 84 }}>{label}</span>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} className={`chip scale ${form[k] === n ? 'on' : ''}`} onClick={() => setForm({ ...form, [k]: n })}>{n}</button>
      ))}
    </div>
  );

  if (loading) return <LoadingState>Loading speaking log...</LoadingState>;
  if (err && items.length === 0 && !mock) {
    return (
      <ErrorState
        title="Speaking log needs the database"
        message={err}
        hint="Add Supabase credentials in server/.env for logs. The mock generator also needs GROQ_API_KEY."
        onRetry={load}
      />
    );
  }

  return (
    <div className="fade-in">
      <h2 className="section-title">Speaking</h2>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="label-row"><h3>Generate a 4-question mock</h3>
          <button className="btn sm" onClick={runMock} disabled={mockBusy}>{mockBusy ? '…' : 'New mock'}</button></div>
        {mock?.error && <div className="error">{mock.error}</div>}
        {mock?.intro && <p className="muted" style={{ marginTop: 6 }}>{mock.intro}</p>}
        {mock?.questions?.map((q, i) => (
          <div key={i} className="list-item" style={{ marginTop: 8 }}>
            <span className="pill">{q.area}</span>
            <div style={{ fontWeight: 500, marginTop: 6 }}>{q.question}</div>
            <div className="faint" style={{ marginTop: 4 }}>Good answer: {q.what_good_looks_like}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="label-row"><h3>Log a recording</h3></div>
        <select value={form.prompt} onChange={e => setForm({ ...form, prompt: e.target.value })} style={{ marginBottom: 10 }}>
          {PROMPTS.map(p => <option key={p}>{p}</option>)}
        </select>
        <Scale k="clarity" label="Clarity" />
        <Scale k="pace" label="Pace" />
        <Scale k="confidence" label="Confidence" />
        <input placeholder="One fix for next time" value={form.one_fix} onChange={e => setForm({ ...form, one_fix: e.target.value })} style={{ marginTop: 6 }} />
        <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={add}>Log it</button></div>
      </div>

      {err && <div className="error">{err}</div>}

      {items.map(r => (
        <div key={r.id} className="list-item">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>{r.prompt}</b>
            <span className="faint">{new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          <div className="faint" style={{ marginTop: 4 }}>clarity {r.clarity} - pace {r.pace} - confidence {r.confidence}</div>
          {r.one_fix && <div className="muted" style={{ marginTop: 4 }}>Fix: {r.one_fix}</div>}
        </div>
      ))}
      {items.length === 0 && <p className="center-note">No recordings logged yet. Record one answer today — even 30 seconds counts.</p>}
    </div>
  );
}

````

### client\src\pages\Today.jsx

````jsx
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorState, LoadingState } from '../components/States.jsx';

const MODES = [['full', 'Full - 2h'], ['normal', 'Normal - 90m'], ['low', 'Low - 20m']];

function Chain({ series }) {
  const recent = (series || []).slice(-21);
  if (!recent.length) {
    return <div className="chain-label">Your chain starts today. The only bad day is disappearing for many in a row.</div>;
  }
  const alive = recent.filter(s => s.points > 0).length;
  return (
    <div className="chain-wrap">
      <div className="chain">
        {recent.map((s, i) => {
          const cls = s.points === 0 ? (s.status === 'rest' ? 'rest' : '') : s.mode;
          return <span key={i} className={`link ${cls}`} title={`${s.date} - ${s.status}`} />;
        })}
      </div>
      <div className="chain-label"><b>{alive}</b> days kept alive</div>
    </div>
  );
}

export default function Today() {
  const [data, setData] = useState(null);
  const [series, setSeries] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const [energy, setEnergy] = useState(null);
  const [mood, setMood] = useState(null);

  const [note, setNote] = useState('');
  const [noteTopic, setNoteTopic] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [noteBusy, setNoteBusy] = useState(false);

  async function load() {
    try {
      setErr('');
      const [t, p] = await Promise.all([api.getToday(), api.progress().catch(() => ({ series: [] }))]);
      setData(t);
      setSeries(p.series || []);
      if (t.log) { setEnergy(t.log.energy); setMood(t.log.mood); }
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  if (!data && err) {
    const setupHint = err.includes('Database is not configured')
      ? 'Copy server/.env.example to server/.env, add your Supabase URL and service role key, then restart the backend.'
      : 'Check that the backend is running and your client/server passcodes match.';
    return <ErrorState title="Today needs setup" message={err} hint={setupHint} onRetry={load} />;
  }
  if (!data) return <LoadingState>Loading today...</LoadingState>;

  const { day, tasks, plan } = data;
  const beforeStart = plan?.beforeStart;
  const doneCount = tasks.filter(t => t.done).length;

  async function toggle(id) {
    setErr('');
    setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) }));
    try { await api.toggleTask(id); } catch (e) { setErr(e.message); load(); }
  }

  async function chooseMode(m) {
    setData(d => ({ ...d, day: { ...d.day, mode: m } }));
    try { await api.setMode(day.the_date, m); } catch (e) { setErr(`Could not save mode: ${e.message}`); }
  }

  async function setScale(kind, val) {
    const e = kind === 'energy' ? val : energy;
    const mo = kind === 'mood' ? val : mood;
    if (kind === 'energy') setEnergy(val); else setMood(val);
    try {
      await api.saveLog({ date: day.the_date, energy: e, mood: mo });
    } catch (e) {
      console.warn('[today] check-in save failed', e);
      setErr(`Could not save check-in: ${e.message}`);
    }
  }

  async function replan() {
    setBusy(true); setMsg(''); setErr('');
    try {
      const minutes = day.mode === 'low' ? 20 : day.mode === 'full' ? 120 : 90;
      const out = await api.replan({ date: day.the_date, energy, mood, minutes });
      setData(d => ({ ...d, tasks: out.tasks, day: { ...d.day, mode: out.mode || d.day.mode } }));
      setMsg(out.message || 'Re-planned for today.');
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function sendNote() {
    if (!note.trim()) return;
    setNoteBusy(true); setFeedback(null); setErr('');
    try {
      const out = await api.sendNote({ topic: noteTopic, content: note });
      setFeedback(out.note);
      setNote('');
    } catch (e) { setErr(e.message); }
    setNoteBusy(false);
  }

  async function finishDay(status) {
    setBusy(true); setErr('');
    try {
      await api.setStatus(day.the_date, status);
      setMsg(status === 'done' ? 'Day marked done. Chain alive.' : status === 'rest' ? 'Rest day logged. No guilt.' : 'Logged.');
      const p = await api.progress().catch(() => ({ series: [] }));
      setSeries(p.series || []);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  const today = new Date(day.the_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="fade-in">
      {err && (
        <div className="card" style={{ borderColor: '#5a342f', marginBottom: 14 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="error" style={{ margin: 0 }}>{err}</div>
            <button className="btn sm ghost" onClick={() => setErr('')}>Dismiss</button>
          </div>
        </div>
      )}
      <div className="card">
        <div className="eyebrow">{day.week_label || 'Plan'}{!beforeStart && ` - Day ${day.day_index}`}</div>
        <h1 className="day-title">{today}</h1>
        <p className="focus">{day.focus}</p>
        <Chain series={series} />
      </div>

      {beforeStart ? (
        <div className="card"><p className="muted">Your 90-day plan begins on its start date. Update <code>PLAN_START_DATE</code> in the backend <code>.env</code> if you want to begin today.</p></div>
      ) : (
        <>
          <div className="card">
            <div className="label-row">
              <h3>Today's mode</h3>
              <span className="faint">{doneCount}/{tasks.length} done</span>
            </div>
            <div className="row">
              {MODES.map(([m, label]) => (
                <button key={m} className={`chip ${day.mode === m ? 'on' : ''}`} onClick={() => chooseMode(m)}>{label}</button>
              ))}
            </div>

            <div className="divider" />

            <div className="label-row"><h3>How are you today?</h3></div>
            <div className="row" style={{ marginBottom: 8 }}>
              <span className="faint" style={{ width: 58 }}>Energy</span>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} className={`chip scale ${energy === n ? 'on' : ''}`} onClick={() => setScale('energy', n)}>{n}</button>
              ))}
            </div>
            <div className="row">
              <span className="faint" style={{ width: 58 }}>Mood</span>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} className={`chip scale ${mood === n ? 'on' : ''}`} onClick={() => setScale('mood', n)}>{n}</button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="label-row">
              <h3>Three things</h3>
              <button className="btn sm ghost" onClick={replan} disabled={busy}>{busy ? '…' : '↻ Re-plan with AI'}</button>
            </div>

            {msg && <div className="toast" style={{ marginBottom: 10 }}>{msg}</div>}

            {tasks.length === 0 && <p className="muted">No tasks for today. Try re-planning, or it may be a review day.</p>}

            {tasks.map(t => (
              <div key={t.id} className={`task ${t.done ? 'done' : ''}`} onClick={() => toggle(t.id)}>
                <div className="check">✓</div>
                <div style={{ flex: 1 }}>
                  <span className={`kind-tag kind-${t.kind}`}>{t.kind}</span>
                  <div className="task-title">{t.title}</div>
                  <p className="task-detail">{t.detail}</p>
                  <div className="task-meta">
                    {t.minutes ? <span className="min">{t.minutes} min</span> : null}
                    {t.resource_url ? <a href={t.resource_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>open resource �-</a> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="label-row"><h3>Paste what you learned</h3></div>
            <p className="faint" style={{ marginTop: -4, marginBottom: 10 }}>Notes, an answer you wrote, anything. You'll get quick feedback and a question to test yourself.</p>
            <input placeholder="Topic (optional) — e.g. INNER JOIN" value={noteTopic} onChange={e => setNoteTopic(e.target.value)} style={{ marginBottom: 8 }} />
            <textarea placeholder="Type or paste here…" value={note} onChange={e => setNote(e.target.value)} />
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn primary" onClick={sendNote} disabled={noteBusy || !note.trim()}>{noteBusy ? 'Thinking…' : 'Get feedback'}</button>
            </div>
            {feedback && (
              <div className="ai-box">
                <div className="who">Coach</div>
                <div>{feedback.ai_feedback || 'Saved. (AI feedback unavailable — check GROQ_API_KEY.)'}</div>
                {feedback.follow_up && <div className="follow">Test yourself: {feedback.follow_up}</div>}
                {feedback.restudy_flag && <div className="restudy" style={{ marginTop: 8 }}>Worth a re-study before moving on.</div>}
              </div>
            )}
          </div>

          <div className="card">
            <div className="label-row"><h3>Close the day</h3></div>
            <div className="row">
              <button className="btn sage" onClick={() => finishDay('done')} disabled={busy}>Mark done</button>
              <button className="btn ghost" onClick={() => finishDay('rest')} disabled={busy}>Rest day</button>
            </div>
            <p className="faint" style={{ marginTop: 10 }}>A tiny day still counts. Closing the day keeps your chain honest.</p>
          </div>
        </>
      )}
    </div>
  );
}

````

### client\src\styles.css

````css
:root {
  --bg:        #0e1116;
  --bg-2:      #141922;
  --surface:   #1a2029;
  --surface-2: #20262f;
  --border:    #2a313c;
  --border-soft:#222934;
  --text:      #e8eaed;
  --muted:     #9aa4b2;
  --faint:     #6b7480;

  --amber:     #e6a552;   /* the desk lamp — today / active */
  --amber-dim: #3a2f1f;
  --sage:      #84b06a;   /* done, kept alive */
  --sage-dim:  #243019;

  --code:      #6fb1d6;
  --learn:     #b58fe0;
  --speak:     #e0a366;

  --radius:    14px;
  --radius-sm: 9px;
  --shadow:    0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 30px rgba(0,0,0,0.35);
  --display: 'Space Grotesk', system-ui, sans-serif;
  --body: 'Inter', system-ui, sans-serif;
  --mono: ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace;
}

* { box-sizing: border-box; }
html, body, #root { height: 100%; }
body {
  margin: 0;
  background:
    radial-gradient(1200px 600px at 70% -10%, rgba(230,165,82,0.06), transparent 60%),
    var(--bg);
  color: var(--text);
  font-family: var(--body);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; }
button { font-family: inherit; cursor: pointer; }

/* ---------- shell ---------- */
.shell { max-width: 760px; margin: 0 auto; padding: 22px 18px 80px; }

.topbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px;
}
.brand { display: flex; align-items: baseline; gap: 9px; }
.brand b { font-family: var(--display); font-weight: 700; font-size: 17px; letter-spacing: -0.01em; }
.brand .lamp {
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--amber); box-shadow: 0 0 12px 2px rgba(230,165,82,0.6);
}
.brand span { color: var(--faint); font-size: 12.5px; }

/* ---------- nav ---------- */
nav.tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 22px; }
nav.tabs a {
  text-decoration: none; color: var(--muted);
  font-size: 13.5px; font-weight: 500;
  padding: 7px 12px; border-radius: 99px;
  border: 1px solid transparent;
}
nav.tabs a:hover { color: var(--text); background: var(--bg-2); }
nav.tabs a.active {
  color: var(--text); background: var(--surface);
  border-color: var(--border);
}

/* ---------- cards ---------- */
.card {
  background: linear-gradient(180deg, var(--surface), var(--bg-2));
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 18px;
}
.card + .card { margin-top: 14px; }

.eyebrow {
  font-size: 11.5px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--amber); font-weight: 600;
}
h1.day-title { font-family: var(--display); font-size: 26px; font-weight: 700; letter-spacing: -0.02em; margin: 4px 0 6px; }
.focus { color: var(--muted); font-size: 14px; margin: 0; }

/* ---------- chain (signature) ---------- */
.chain-wrap { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
.chain { display: flex; gap: 5px; flex-wrap: wrap; }
.link {
  width: 13px; height: 13px; border-radius: 4px;
  background: transparent; border: 1.5px solid var(--border);
}
.link.full   { background: var(--amber); border-color: var(--amber); box-shadow: 0 0 8px rgba(230,165,82,0.45); }
.link.normal { background: var(--sage);  border-color: var(--sage); }
.link.low    { background: var(--sage-dim); border-color: var(--sage); }
.link.rest   { background: transparent; border-style: dashed; border-color: var(--faint); }
.chain-label { font-size: 12.5px; color: var(--faint); white-space: nowrap; }
.chain-label b { color: var(--sage); font-weight: 600; }

/* ---------- mode chips ---------- */
.row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.label-row { display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px; }
.label-row h3 { margin: 0; font-family: var(--display); font-size: 14px; font-weight: 600; color: var(--muted); letter-spacing: 0.02em; }
.chip {
  border: 1px solid var(--border); background: var(--surface-2);
  color: var(--muted); border-radius: 99px; padding: 6px 13px; font-size: 13px;
}
.chip:hover { color: var(--text); }
.chip.on { color: var(--bg); background: var(--amber); border-color: var(--amber); font-weight: 600; }
.chip.scale.on { background: var(--sage); border-color: var(--sage); }

/* ---------- tasks ---------- */
.task {
  display: flex; gap: 13px; align-items: flex-start;
  padding: 14px; border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm); background: var(--surface);
  transition: border-color .15s ease, opacity .15s ease;
}
.task + .task { margin-top: 10px; }
.task:hover { border-color: var(--border); }
.task.done { opacity: 0.55; }
.task.done .task-title { text-decoration: line-through; text-decoration-color: var(--faint); }

.check {
  margin-top: 1px; flex: none;
  width: 22px; height: 22px; border-radius: 7px;
  border: 1.5px solid var(--border); background: var(--bg-2);
  display: grid; place-items: center; color: transparent; font-size: 13px;
}
.task.done .check { background: var(--sage); border-color: var(--sage); color: var(--bg); }

.kind-tag {
  font-family: var(--mono); font-size: 10.5px; text-transform: uppercase;
  letter-spacing: 0.08em; padding: 2px 7px; border-radius: 5px; font-weight: 600;
}
.kind-code  { color: var(--code);  background: rgba(111,177,214,0.12); }
.kind-learn { color: var(--learn); background: rgba(181,143,224,0.12); }
.kind-speak { color: var(--speak); background: rgba(224,163,102,0.12); }

.task-title { font-size: 15px; font-weight: 600; margin: 6px 0 3px; }
.task-detail { color: var(--muted); font-size: 13.5px; margin: 0; }
.task-meta { display: flex; gap: 12px; align-items: center; margin-top: 8px; }
.task-meta a { color: var(--code); font-size: 12.5px; text-decoration: none; }
.task-meta a:hover { text-decoration: underline; }
.task-meta .min { color: var(--faint); font-size: 12px; font-family: var(--mono); }

/* ---------- buttons ---------- */
.btn {
  border: 1px solid var(--border); background: var(--surface-2); color: var(--text);
  border-radius: var(--radius-sm); padding: 10px 16px; font-size: 14px; font-weight: 500;
}
.btn:hover { background: var(--surface); border-color: var(--faint); }
.btn.primary { background: var(--amber); border-color: var(--amber); color: #1a130a; font-weight: 600; }
.btn.primary:hover { filter: brightness(1.06); }
.btn.ghost { background: transparent; }
.btn.sage { background: var(--sage); border-color: var(--sage); color: #0e1a0a; font-weight: 600; }
.btn:disabled { opacity: 0.5; cursor: default; }
.btn.sm { padding: 6px 11px; font-size: 12.5px; }

/* ---------- inputs ---------- */
textarea, input, select {
  width: 100%; background: var(--bg-2); color: var(--text);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  padding: 10px 12px; font-family: inherit; font-size: 14px;
}
textarea { resize: vertical; min-height: 84px; }
textarea:focus, input:focus, select:focus { outline: none; border-color: var(--amber); }
label.field { display: block; font-size: 12.5px; color: var(--muted); margin: 0 0 5px; }

/* ---------- ai feedback ---------- */
.ai-box {
  border: 1px solid var(--amber-dim); background: rgba(230,165,82,0.05);
  border-radius: var(--radius-sm); padding: 13px; margin-top: 12px; font-size: 14px;
}
.ai-box .who { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--amber); font-weight: 600; margin-bottom: 6px; }
.ai-box .follow { color: var(--muted); margin-top: 8px; font-style: italic; }
.restudy { color: var(--speak); font-weight: 600; }

/* ---------- tables / lists ---------- */
.list-item {
  border: 1px solid var(--border-soft); border-radius: var(--radius-sm);
  padding: 12px 14px; background: var(--surface);
}
.list-item + .list-item { margin-top: 8px; }
.muted { color: var(--muted); }
.faint { color: var(--faint); font-size: 12.5px; }
.pill { font-size: 11.5px; padding: 2px 9px; border-radius: 99px; border: 1px solid var(--border); color: var(--muted); }

/* ---------- progress bars ---------- */
.bars { display: flex; align-items: flex-end; gap: 4px; height: 90px; margin-top: 14px; }
.bar { flex: 1; background: var(--border); border-radius: 3px 3px 0 0; min-height: 3px; }
.bar.full { background: var(--amber); }
.bar.normal { background: var(--sage); }
.bar.low { background: var(--sage-dim); }
.stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.stat { border: 1px solid var(--border-soft); border-radius: var(--radius-sm); padding: 14px; background: var(--surface); }
.stat .n { font-family: var(--display); font-size: 28px; font-weight: 700; }
.stat .k { color: var(--faint); font-size: 12.5px; }

/* ---------- misc ---------- */
.section-title { font-family: var(--display); font-size: 20px; font-weight: 600; margin: 0 0 14px; letter-spacing: -0.01em; }
.spacer { height: 14px; }
.center-note { text-align: center; color: var(--faint); padding: 30px 10px; }
.error { color: #e08a7a; font-size: 13px; margin-top: 8px; }
.toast { color: var(--sage); font-size: 13px; margin-top: 8px; }
.divider { height: 1px; background: var(--border-soft); margin: 16px 0; }

.gate { max-width: 360px; margin: 80px auto; }

@media (max-width: 520px) {
  h1.day-title { font-size: 23px; }
  .stat-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
.fade-in { animation: fade .35s ease both; }
@keyframes fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

````

### client\vite.config.js

````javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
});

````

### README.md

````markdown
# Mentor — your daily interview-prep coach

A single dashboard that hands you **3 tasks a day** (Code · Learn · Speak), lets you tick them off, paste what you learned for instant AI feedback, and hands you tomorrow. Your 90-day plan is the spine; AI only adapts it when you ask.

Built to be the opposite of 16 markdown files: **rich underneath, dead-simple to use daily.** The Today tab is the only screen you need most days.

---

## What's inside

- **Today** — the daily driver: 3 tasks, energy/mood, "Re-plan with AI", "paste what you learned" → feedback, close the day.
- **Roadmap** — your 90-day plan as readable phases.
- **Questions** — question bank with status tracking and your own answers.
- **Applications** — job tracker with status pipeline.
- **Speaking** — recording log (clarity/pace/confidence) + AI mock generator.
- **Progress** — streak, points, and a calm bar chart. The "chain" rewards *kept alive*, never punishes a miss.

All six tabs are functional and talk to a real backend. Nothing here is a mock.

---

## Architecture

```
  React (Vite)  ──fetch──▶  Express backend  ──▶  Supabase Postgres   (your real DB)
  one passcode             holds ALL secret      ──▶  Groq            (AI: re-plan, feedback, mock)
  header                   keys, never the       ──▶  Notion          (one-way sync: your reading layer)
                           frontend
```

- **Source of truth:** Supabase. **Notion:** synced reading/notes layer (optional).
- **AI:** Groq free tier, so you're never blocked when a subscription runs out. Plain `fetch`, no SDK.
- The 90-day plan lives in `server/src/data/roadmap.json` + `taskBank.json`. Days 1–14 are explicit; day 15+ is generated from phases + your weekday rhythm (Mon=C#, Tue=SQL, Wed=.NET, Thu=frontend, Fri=Azure/AI, Sat=deep work, Sun=review).

---

## Setup (about 15 minutes)

### 0. Prerequisites
- Node 18+ installed.

### 1. Supabase (the database)
1. Create a free project at supabase.com.
2. Open **SQL Editor → New query**, paste all of `server/db/schema.sql`, **Run**.
3. **Project Settings → API**: copy the **Project URL** and the **service_role** key.

### 2. Backend
```bash
cd server
npm install
cp .env.example .env
```
Edit `server/.env`:
- `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (from step 1)
- `GROQ_API_KEY` — get a free key at console.groq.com → API Keys
- `GROQ_MODEL` — pick a current chat model from console.groq.com/docs/models
- `APP_PASSCODE` — make up a private string (your light gate)
- `PLAN_START_DATE` — day 1 of your plan (default `2026-06-17`)

Run it:
```bash
npm run dev      # http://localhost:4000
```

### 3. Frontend
```bash
cd client
npm install
cp .env.example .env
```
Edit `client/.env`:
- `VITE_API_URL=http://localhost:4000`
- `VITE_APP_PASSCODE=` the same passcode you set in the backend

Run it:
```bash
npm run dev      # http://localhost:5173
```

Open http://localhost:5173. You should see today's 3 tasks.

### 4. Notion sync (optional)
Two ways:
- **Auto-create the databases:** in `notion.so/my-integrations` create an integration, copy its token into `NOTION_TOKEN`. Create one Notion page, share it with the integration, put its 32-char id in `NOTION_PARENT_PAGE_ID`, then:
  ```bash
  cd server && npm run setup-notion
  ```
  Paste the three printed IDs into `.env`.
- **Use existing databases:** just paste their IDs into `NOTION_DAILY_DB_ID`, `NOTION_QUESTIONS_DB_ID`, `NOTION_APPLICATIONS_DB_ID` (share each DB with your integration first).

Sync is one-way (app → Notion) and fires when you close a day / add a question / add an application. If Notion isn't configured, the app simply skips it.

---

## Deploy (free tier)

- **Backend → Railway** (or Render): deploy the `server` folder, add the same `.env` vars, set `CLIENT_ORIGIN` to your frontend URL.
- **Frontend → Vercel:** import the `client` folder, set `VITE_API_URL` to your Railway backend URL and `VITE_APP_PASSCODE`.

---

## The daily ritual (under 2 minutes)

1. Open **Today**.
2. Tap your **mode** (Full / Normal / Low) and your **energy**.
3. Low energy? Tap **Re-plan with AI** — it shrinks the day so you never take a zero.
4. Do the tasks, tick them off.
5. Paste anything you learned → get a quick check.
6. **Mark done** (or **Rest day** — no guilt). Your chain stays alive.

---

## Customizing the plan

- Edit `server/src/data/taskBank.json` to add/replace drills per topic.
- Edit `server/src/data/roadmap.json` to change the explicit first 14 days, the weekly phases, or the weekday focus.
- No code change needed — the planner reads these files.

---

## What's next (ideas, not required)
- Email/push the daily 3 tasks (you already run n8n).
- Two-way Notion sync if you'd rather edit in Notion.
- Add your partner as a second user (the schema is single-user today; add a `user_id` column + Supabase Auth when you want this).

````

### server\db\schema.sql

````sql
-- ============================================================
--  Interview Mentor — Supabase schema
--  Run this in Supabase: SQL Editor -> New query -> paste -> Run
--  Single-user app, so no RLS user scoping. The backend uses the
--  service role key and is the only thing that talks to these tables.
-- ============================================================

-- One row per calendar day you engage with the plan.
create table if not exists days (
  id            bigint generated always as identity primary key,
  day_index     int  not null,                 -- 1..90, your position in the plan
  the_date      date not null unique,           -- actual calendar date
  week_label    text,                           -- e.g. "Week 3 — .NET Core & Web API"
  phase         text,                           -- short phase name
  focus         text,                           -- one-line focus for the day
  mode          text not null default 'normal', -- full | normal | low
  status        text not null default 'pending',-- pending | done | rest | skipped
  was_replanned boolean not null default false,
  created_at    timestamptz not null default now()
);

-- The 3 (or adjusted) tasks for a given day.
create table if not exists tasks (
  id           bigint generated always as identity primary key,
  day_id       bigint not null references days(id) on delete cascade,
  kind         text not null,                   -- code | learn | speak
  title        text not null,
  detail       text,
  resource_url text,
  minutes      int,
  position     int not null default 0,
  done         boolean not null default false,
  done_at      timestamptz
);

-- Daily check-in (energy, mood, reflection).
create table if not exists logs (
  id                 bigint generated always as identity primary key,
  the_date           date not null unique,
  energy             int,                        -- 1..5
  mood               int,                        -- 1..5
  what_felt_hard     text,
  what_avoided       text,
  minutes_tomorrow   int,
  created_at         timestamptz not null default now()
);

-- "Paste what you learned" entries + AI feedback.
create table if not exists notes (
  id           bigint generated always as identity primary key,
  the_date     date not null default current_date,
  topic        text,
  content      text not null,
  ai_feedback  text,
  follow_up    text,
  restudy_flag boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Interview question bank.
create table if not exists questions (
  id             bigint generated always as identity primary key,
  topic          text not null,                 -- C# | .NET | SQL | DSA | Azure | AI | React | Angular | Behavioral | Project
  difficulty     text not null default 'Easy',  -- Easy | Medium | Hard
  question       text not null,
  my_answer      text,
  status         text not null default 'New',   -- New | Learning | Can Answer | Mock Passed
  mistake        text,
  last_practiced date,
  created_at     timestamptz not null default now()
);

-- Job application tracker.
create table if not exists applications (
  id             bigint generated always as identity primary key,
  company        text not null,
  role           text,
  location       text,
  source         text,                          -- LinkedIn | Naukri | Instahyre | Referral | ...
  stack          text,
  status         text not null default 'Applied',-- Applied | Screen | Tech | Final | Offer | Rejected
  applied_date   date default current_date,
  recruiter      text,
  interview_date date,
  questions_asked text,
  result         text,
  created_at     timestamptz not null default now()
);

-- Speaking / recording tracker.
create table if not exists recordings (
  id          bigint generated always as identity primary key,
  the_date    date not null default current_date,
  prompt      text not null,
  duration_s  int,
  clarity     int,                              -- 1..5
  pace        int,                              -- 1..5
  confidence  int,                              -- 1..5
  one_fix     text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_tasks_day  on tasks(day_id);
create index if not exists idx_days_date  on days(the_date);
create index if not exists idx_notes_date on notes(the_date);

-- Seed a few starter questions so the Question Bank is not empty.
insert into questions (topic, difficulty, question) values
  ('C#',        'Easy',   'What is the difference between a value type and a reference type?'),
  ('C#',        'Medium', 'Why can calling .Result on an async task deadlock?'),
  ('.NET',      'Easy',   'What is dependency injection and what are the three lifetimes?'),
  ('.NET',      'Medium', 'Walk through the ASP.NET Core middleware pipeline for a request.'),
  ('SQL',       'Easy',   'INNER JOIN vs LEFT JOIN — when do rows drop?'),
  ('SQL',       'Medium', 'How would you investigate a slow stored procedure?'),
  ('DSA',       'Easy',   'Explain the two-pointer pattern with an example.'),
  ('Azure',     'Easy',   'Why use Azure App Service to host an API?'),
  ('AI',        'Medium', 'Azure OpenAI vs OpenAI — when and why?'),
  ('Behavioral','Easy',   'Tell me about yourself.'),
  ('Behavioral','Easy',   'Why are you looking for a change?'),
  ('Project',   'Medium', 'Explain the 40% SQL performance improvement in detail.')
on conflict do nothing;

````

### server\package.json

````json
{
  "name": "interview-mentor-server",
  "version": "1.0.0",
  "type": "module",
  "description": "Backend for the personal interview-prep mentor app",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "setup-notion": "node src/setup-notion.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2"
  }
}

````

### server\src\data\roadmap.json

````json
{
  "meta": {
    "title": "Bench to Product Company — .NET Full-Stack Comeback",
    "owner": "Dwarkesh",
    "totalDays": 90,
    "weekdayMaxMinutes": 120,
    "note": "Days 1-14 are explicit rehabilitation days. Day 15 onward is generated from phases + weekday focus + the task bank. The roadmap is the spine; AI only adapts within the current phase."
  },

  "consistencyRules": [
    "Never Zero: do at least one tiny thing every day. 10 minutes counts.",
    "Two-Day Rule: missing one day is rest. Never miss two in a row.",
    "No-Guilt Reset: missed tasks are not debt. You do not carry yesterday into today.",
    "A low-energy day kept the chain alive. That is a win, not a failure."
  ],

  "modes": {
    "full":   { "label": "Full day",   "minutes": 120, "split": { "code": 45, "learn": 45, "speak": 20, "track": 10 } },
    "normal": { "label": "Normal day", "minutes": 90,  "split": { "code": 35, "learn": 35, "speak": 15, "track": 5 } },
    "low":    { "label": "Low energy", "minutes": 20,  "split": { "code": 0,  "learn": 15, "speak": 5,  "track": 0 } }
  },

  "weekdayFocus": {
    "0": { "name": "Review & recovery", "topics": ["review", "speaking"] },
    "1": { "name": "C# + one DSA",       "topics": ["csharp", "dsa"] },
    "2": { "name": "SQL",                "topics": ["sql"] },
    "3": { "name": ".NET API",           "topics": ["dotnet"] },
    "4": { "name": "Frontend",           "topics": ["javascript", "typescript", "react", "angular"] },
    "5": { "name": "Azure / AI / Resume","topics": ["azure", "ai", "resume"] },
    "6": { "name": "Deep work + mock",   "topics": ["dotnet", "systemdesign", "mock"] }
  },

  "phases": [
    { "startDay": 15, "endDay": 21,  "week": 3,  "name": ".NET Core & Web API",        "focus": "Become employable in core .NET interviews. Build the Employee API.", "topics": ["dotnet", "csharp", "speaking"] },
    { "startDay": 22, "endDay": 28,  "week": 4,  "name": "SQL Depth & Project Defense", "focus": "Stop fearing SQL writing. Defend every resume project.",              "topics": ["sql", "resume", "speaking"] },
    { "startDay": 29, "endDay": 35,  "week": 5,  "name": "JavaScript & TypeScript",     "focus": "Be believable as full-stack.",                                        "topics": ["javascript", "typescript", "speaking"] },
    { "startDay": 36, "endDay": 42,  "week": 6,  "name": "React Practical",             "focus": "Handle real frontend interview basics. Build an admin users page.",    "topics": ["react", "javascript", "speaking"] },
    { "startDay": 43, "endDay": 49,  "week": 7,  "name": "Angular Practical",           "focus": "Cover the framework you claim, strongly enough.",                     "topics": ["angular", "typescript", "speaking"] },
    { "startDay": 50, "endDay": 56,  "week": 8,  "name": "Azure & AI Integration",      "focus": "Make your differentiator real and explainable.",                      "topics": ["azure", "ai", "speaking"] },
    { "startDay": 57, "endDay": 63,  "week": 9,  "name": "System Design",               "focus": "Structure answers like a mid-level engineer.",                        "topics": ["systemdesign", "dotnet", "speaking"] },
    { "startDay": 64, "endDay": 70,  "week": 10, "name": "Mock Interview Sprint",       "focus": "Pressure practice. Coding, SQL, .NET, behavioral, project defense.",  "topics": ["mock", "dsa", "speaking"] },
    { "startDay": 71, "endDay": 77,  "week": 11, "name": "Resume / Portfolio / GitHub", "focus": "Remove avoidable rejection reasons. Align resume, portfolio, GitHub.","topics": ["resume", "dotnet", "speaking"] },
    { "startDay": 78, "endDay": 90,  "week": 12, "name": "Applications & Real Interviews","focus": "Apply without panic. Every interview becomes practice data.",       "topics": ["mock", "resume", "speaking"] }
  ],

  "explicitDays": [
    {
      "day": 1, "title": "C# Program Structure", "defaultMode": "normal",
      "tasks": [
        { "kind": "code",  "title": "Hello World + variables + array", "detail": "Write Hello World, print your name, create int/string/bool/double variables, an array of 5 numbers, print it with for AND foreach.", "minutes": 35, "resource": "https://learn.microsoft.com/en-us/dotnet/csharp/" },
        { "kind": "learn", "title": "What Main does in C#", "detail": "Read the C# program structure page. Write 5 bullet notes on Main, namespaces, and entry point.", "minutes": 35, "resource": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/program-structure/" },
        { "kind": "speak", "title": "Explain Main out loud", "detail": "Record 60 seconds: what Main is and why every C# program needs an entry point.", "minutes": 15, "resource": "" }
      ]
    },
    {
      "day": 2, "title": "Functions and Conditions", "defaultMode": "normal",
      "tasks": [
        { "kind": "code",  "title": "Write 4 small methods", "detail": "Add(int a,int b), IsEven(int n), GetMax(int[] numbers), CountPositiveNumbers(int[] numbers). Type them, do not copy.", "minutes": 40, "resource": "https://exercism.org/tracks/csharp" },
        { "kind": "learn", "title": "Parameters & return types", "detail": "Note the difference between parameters, arguments, return types, and void.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/dotnet/csharp/" },
        { "kind": "speak", "title": "Explain method parameters", "detail": "Record 60 seconds explaining parameters and return type with one example.", "minutes": 15, "resource": "" }
      ]
    },
    {
      "day": 3, "title": "Arrays and Strings", "defaultMode": "normal",
      "tasks": [
        { "kind": "code",  "title": "5 array/string drills", "detail": "Sum array, reverse array, reverse string, count vowels, check palindrome.", "minutes": 40, "resource": "https://exercism.org/tracks/csharp" },
        { "kind": "learn", "title": "String immutability", "detail": "Why strings are immutable in C#, and what string indexing means. 5 notes.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/strings/" },
        { "kind": "speak", "title": "Explain string immutability", "detail": "Record 60 seconds on array indexing and why strings are immutable.", "minutes": 15, "resource": "" }
      ]
    },
    {
      "day": 4, "title": "List and Dictionary", "defaultMode": "normal",
      "tasks": [
        { "kind": "code",  "title": "List + Dictionary drills", "detail": "Create List<string> of names, add/remove, build a word-frequency Dictionary, count each character in a string.", "minutes": 40, "resource": "https://learn.microsoft.com/en-us/dotnet/csharp/" },
        { "kind": "learn", "title": "List vs Array; Dictionary uses", "detail": "When to use a List vs an Array, and a real Dictionary use case. 5 notes.", "minutes": 30, "resource": "" },
        { "kind": "speak", "title": "Explain List vs Array", "detail": "Record 60 seconds: List vs Array and one Dictionary use case.", "minutes": 15, "resource": "" }
      ]
    },
    {
      "day": 5, "title": "Classes and Objects", "defaultMode": "normal",
      "tasks": [
        { "kind": "code",  "title": "Employee class", "detail": "Create Employee class with Id, Name, Department, Salary. Make 3 employees. Print only active ones.", "minutes": 40, "resource": "" },
        { "kind": "learn", "title": "Class vs object", "detail": "Difference between a class (blueprint) and an object (instance). Properties vs fields. 5 notes.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/" },
        { "kind": "speak", "title": "Explain class vs object", "detail": "Record 60 seconds with the blueprint analogy.", "minutes": 15, "resource": "" }
      ]
    },
    {
      "day": 6, "title": "OOP Basics", "defaultMode": "normal",
      "tasks": [
        { "kind": "code",  "title": "Inheritance + interface", "detail": "Person base class, Employee derived class, IWork interface, implement DoWork().", "minutes": 40, "resource": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/" },
        { "kind": "learn", "title": "Inheritance vs interface", "detail": "When to use inheritance vs an interface. Abstract class vs interface. 5 notes.", "minutes": 30, "resource": "" },
        { "kind": "speak", "title": "Explain inheritance & interface", "detail": "Record 90 seconds with a real example.", "minutes": 15, "resource": "" }
      ]
    },
    {
      "day": 7, "title": "Week 1 Review", "defaultMode": "normal",
      "tasks": [
        { "kind": "code",  "title": "Rewrite days 1-6 from memory", "detail": "No looking. Then redo the 2 exercises you struggled with most.", "minutes": 45, "resource": "" },
        { "kind": "learn", "title": "Gap notes", "detail": "Write down the 3 things that felt hardest this week. These become next week's focus.", "minutes": 20, "resource": "" },
        { "kind": "speak", "title": "Tell me about yourself", "detail": "Record TMAY (75 sec) and 'what did I work on this week'. Save both as baseline.", "minutes": 20, "resource": "" }
      ]
    },
    {
      "day": 8, "title": "SQL Basics", "defaultMode": "normal",
      "tasks": [
        { "kind": "code",  "title": "5 SELECT queries", "detail": "On Employees/Departments/LeaveRequests: SELECT all, active only, ORDER BY salary, TOP 5 salaries, WHERE department = 'IT'.", "minutes": 40, "resource": "https://learn.microsoft.com/en-us/training/paths/get-started-querying-with-transact-sql/" },
        { "kind": "learn", "title": "SELECT / WHERE / ORDER BY", "detail": "Refresh clause order and what each does. 5 notes.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/training/paths/get-started-querying-with-transact-sql/" },
        { "kind": "speak", "title": "Explain SELECT/WHERE/ORDER BY", "detail": "Record 60 seconds.", "minutes": 15, "resource": "" }
      ]
    },
    {
      "day": 9, "title": "SQL Joins", "defaultMode": "normal",
      "tasks": [
        { "kind": "code",  "title": "4 join queries", "detail": "Employees with department name, all employees even with no department, departments with employee count, employees who never applied for leave.", "minutes": 40, "resource": "" },
        { "kind": "learn", "title": "INNER vs LEFT JOIN", "detail": "Visualise the difference. When rows drop vs stay. 5 notes.", "minutes": 30, "resource": "" },
        { "kind": "speak", "title": "Explain INNER vs LEFT JOIN", "detail": "Record 60 seconds with an example.", "minutes": 15, "resource": "" }
      ]
    },
    {
      "day": 10, "title": "SQL Grouping", "defaultMode": "normal",
      "tasks": [
        { "kind": "code",  "title": "4 grouping queries", "detail": "Count employees by department, average salary by department, departments having > 5 employees, monthly leave count.", "minutes": 40, "resource": "" },
        { "kind": "learn", "title": "GROUP BY & HAVING", "detail": "Difference between WHERE and HAVING. 5 notes.", "minutes": 30, "resource": "" },
        { "kind": "speak", "title": "Explain GROUP BY & HAVING", "detail": "Record 60 seconds.", "minutes": 15, "resource": "" }
      ]
    },
    {
      "day": 11, "title": "JavaScript Basics", "defaultMode": "normal",
      "tasks": [
        { "kind": "code",  "title": "JS array-method drills", "detail": "Filter active users, map to names, sum salaries with reduce, group by department manually.", "minutes": 40, "resource": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/" },
        { "kind": "learn", "title": "let / const / array methods", "detail": "let vs const, and map/filter/reduce. 5 notes.", "minutes": 30, "resource": "https://exercism.org/tracks/javascript" },
        { "kind": "speak", "title": "Explain let/const & array methods", "detail": "Record 60 seconds.", "minutes": 15, "resource": "" }
      ]
    },
    {
      "day": 12, "title": "Async JavaScript", "defaultMode": "normal",
      "tasks": [
        { "kind": "code",  "title": "Promise + async/await + fetch", "detail": "Create a Promise, use async/await, fetch a sample API, handle errors with try/catch.", "minutes": 40, "resource": "" },
        { "kind": "learn", "title": "Promise vs async/await", "detail": "What async/await is doing under the hood. 5 notes.", "minutes": 30, "resource": "" },
        { "kind": "speak", "title": "Explain Promise vs async/await", "detail": "Record 60 seconds.", "minutes": 15, "resource": "" }
      ]
    },
    {
      "day": 13, "title": "Mini API Planning", "defaultMode": "normal",
      "tasks": [
        { "kind": "code",  "title": "Design the Employee API", "detail": "Write endpoints, tables, DTOs, service methods, validation rules in a notes file. No heavy coding.", "minutes": 35, "resource": "https://learn.microsoft.com/en-us/aspnet/core/tutorials/first-web-api" },
        { "kind": "learn", "title": "REST design basics", "detail": "Resources, verbs, status codes, PUT vs PATCH. 5 notes.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/aspnet/core/" },
        { "kind": "speak", "title": "Explain your API design", "detail": "Record 3 minutes walking through the design.", "minutes": 15, "resource": "" }
      ]
    },
    {
      "day": 14, "title": "First Mock Day", "defaultMode": "full",
      "tasks": [
        { "kind": "code",  "title": "Self mock — coding", "detail": "Without notes: explain Main, reverse a string, write one SQL join. Time yourself.", "minutes": 45, "resource": "" },
        { "kind": "learn", "title": "Review the mock", "detail": "What was unclear? Where did you pause? Which topic felt embarrassing? Write next week's first fix.", "minutes": 30, "resource": "" },
        { "kind": "speak", "title": "Full mock answer set", "detail": "Record: TMAY, explain HRMS project, 'what if you do not know an answer'. Listen once, note ONE fix.", "minutes": 20, "resource": "" }
      ]
    }
  ]
}

````

### server\src\data\taskBank.json

````json
{
  "csharp": {
    "code": [
      { "title": "Frequency count with Dictionary", "detail": "Count word frequency in a sentence using a Dictionary<string,int>.", "minutes": 35 },
      { "title": "Second largest in array", "detail": "Find the second largest number without sorting the whole array.", "minutes": 35 },
      { "title": "Merge two sorted arrays", "detail": "Merge two sorted int[] into one sorted array.", "minutes": 40 },
      { "title": "LINQ on employees", "detail": "Given a List<Employee>: Where active, Select names, GroupBy department, FirstOrDefault by id.", "minutes": 40 },
      { "title": "Async with HttpClient", "detail": "Call a public API with HttpClient, await the response, deserialize JSON.", "minutes": 40 },
      { "title": "HRMS OOP model", "detail": "Model Employee, Manager, LeaveRequest, IApprovalService, LeaveApprovalService.", "minutes": 45 }
    ],
    "learn": [
      { "title": "IEnumerable vs IQueryable", "detail": "Deferred execution and when LINQ runs in memory vs in the database.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/dotnet/csharp/" },
      { "title": "Value vs reference types", "detail": "Stack vs heap, boxing/unboxing.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/dotnet/csharp/" },
      { "title": "async/await truth", "detail": "Why async does not create a thread, and why .Result can deadlock.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/" },
      { "title": "Garbage collection & IDisposable", "detail": "How GC works at a high level, and the using pattern.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/dotnet/csharp/" }
    ]
  },
  "dotnet": {
    "code": [
      { "title": "Employee API — CRUD", "detail": "GET/GET{id}/POST/PUT/DELETE for employees with DTOs and a service layer.", "minutes": 45, "resource": "https://learn.microsoft.com/en-us/aspnet/core/tutorials/first-web-api" },
      { "title": "Add leave-request endpoints", "detail": "POST /leave-requests and POST /leave-requests/{id}/approve.", "minutes": 45 },
      { "title": "Global exception middleware", "detail": "Add middleware that catches exceptions and returns a clean error response.", "minutes": 35 },
      { "title": "EF Core + AsNoTracking", "detail": "Add DbContext, a migration, seed data, and a read query using AsNoTracking and projection to DTO.", "minutes": 45, "resource": "https://learn.microsoft.com/en-us/ef/core/" }
    ],
    "learn": [
      { "title": "Request pipeline & middleware", "detail": "Order of middleware, what runs per request.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/aspnet/core/" },
      { "title": "DI lifetimes", "detail": "Transient vs scoped vs singleton, and a bug each can cause.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection" },
      { "title": "REST + PUT vs PATCH", "detail": "Idempotency, status codes, full vs partial update.", "minutes": 30 },
      { "title": "JWT auth flow", "detail": "Login, token issue, validation, claims, refresh.", "minutes": 30 }
    ]
  },
  "sql": {
    "code": [
      { "title": "CTE + ROW_NUMBER", "detail": "Top 3 salaries per department using ROW_NUMBER() OVER (PARTITION BY ...).", "minutes": 40 },
      { "title": "Subqueries vs joins", "detail": "Rewrite a correlated subquery as a join and compare.", "minutes": 35 },
      { "title": "Aggregation set", "detail": "Leave count by employee, total hours by month, departments with > 10 employees.", "minutes": 35 },
      { "title": "LeetCode SQL 50 — 3 problems", "detail": "Solve 3 from the Top SQL 50 set. Write the why, not just the answer.", "minutes": 45, "resource": "https://leetcode.com/studyplan/top-sql-50/" }
    ],
    "learn": [
      { "title": "Indexes: seek vs scan", "detail": "Clustered vs non-clustered vs covering index; when a scan happens.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-index-design-guide" },
      { "title": "Execution plans", "detail": "Read a plan, spot the expensive operator.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/sql/relational-databases/performance/execution-plans" },
      { "title": "Deadlocks & isolation", "detail": "What causes a deadlock and how isolation levels relate.", "minutes": 30 },
      { "title": "Window functions", "detail": "ROW_NUMBER vs RANK vs DENSE_RANK, PARTITION BY.", "minutes": 30 }
    ]
  },
  "dsa": {
    "code": [
      { "title": "Two Sum", "detail": "Brute force, then the dictionary O(n) version. Explain out loud.", "minutes": 35, "resource": "https://neetcode.io/roadmap" },
      { "title": "Valid Anagram", "detail": "Frequency-count approach.", "minutes": 30 },
      { "title": "Valid Parentheses", "detail": "Stack approach.", "minutes": 30 },
      { "title": "Binary Search", "detail": "Clean iterative version, handle edges.", "minutes": 30 },
      { "title": "Longest Substring Without Repeating Characters", "detail": "Sliding window.", "minutes": 40 },
      { "title": "Reverse Linked List", "detail": "Iterative pointer reversal.", "minutes": 35 },
      { "title": "Group Anagrams", "detail": "Hashmap of sorted-key buckets.", "minutes": 40 }
    ],
    "learn": [
      { "title": "Two pointers pattern", "detail": "When and why it beats nested loops.", "minutes": 25, "resource": "https://neetcode.io/roadmap" },
      { "title": "Sliding window pattern", "detail": "Fixed vs variable window.", "minutes": 25 },
      { "title": "Hashmap pattern", "detail": "Trade space for time; common shapes.", "minutes": 25 }
    ]
  },
  "javascript": {
    "code": [
      { "title": "Debounce a search input", "detail": "Write a debounce function and apply it to a fake search.", "minutes": 40 },
      { "title": "Promise chain + async rewrite", "detail": "Chain 3 promises, then rewrite with async/await + try/catch.", "minutes": 35 },
      { "title": "Group + summarise data", "detail": "From an array of objects, group by a key and compute totals.", "minutes": 35 },
      { "title": "Fetch + render list", "detail": "Fetch JSON, handle loading/error, render to the DOM.", "minutes": 40 }
    ],
    "learn": [
      { "title": "Closures", "detail": "What a closure is and one real use.", "minutes": 25, "resource": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/" },
      { "title": "Event loop", "detail": "Call stack, task queue, microtasks.", "minutes": 30 },
      { "title": "this in JS", "detail": "How this changes with call/apply/bind and arrow functions.", "minutes": 25 }
    ]
  },
  "typescript": {
    "code": [
      { "title": "Type the Employee model", "detail": "interface Employee + getActiveEmployees(employees: Employee[]): Employee[].", "minutes": 35 },
      { "title": "Generics basics", "detail": "Write a generic function and a generic wrapper type.", "minutes": 35 },
      { "title": "Union + narrowing", "detail": "Model a union type and narrow it safely.", "minutes": 30 }
    ],
    "learn": [
      { "title": "type vs interface", "detail": "When to use each.", "minutes": 25, "resource": "https://exercism.org/tracks/typescript" },
      { "title": "How TS helps React/Angular", "detail": "Props typing, safer refactors.", "minutes": 25 }
    ]
  },
  "react": {
    "code": [
      { "title": "Login form", "detail": "email, password, validation, submit handler, loading state, error message.", "minutes": 45, "resource": "https://react.dev/learn" },
      { "title": "Users list + search", "detail": "List users from an API, add a search/filter box.", "minutes": 45 },
      { "title": "Add/Edit user form", "detail": "Controlled inputs, validation, call your .NET API.", "minutes": 45 }
    ],
    "learn": [
      { "title": "useEffect dependency array", "detail": "Why deps matter and common mistakes.", "minutes": 25, "resource": "https://react.dev/learn" },
      { "title": "Controlled vs uncontrolled", "detail": "And why keys matter in lists.", "minutes": 25 },
      { "title": "When you actually need Context/Redux", "detail": "Prop drilling vs shared state.", "minutes": 25 }
    ]
  },
  "angular": {
    "code": [
      { "title": "Reactive login form", "detail": "FormGroup, validators, submit.", "minutes": 45, "resource": "https://angular.dev/tutorials" },
      { "title": "Users list from API", "detail": "Service + HttpClient + component.", "minutes": 45 },
      { "title": "HTTP interceptor", "detail": "Add a token header via an interceptor.", "minutes": 40 }
    ],
    "learn": [
      { "title": "Observable vs Promise", "detail": "Streams vs single value; unsubscribe.", "minutes": 25, "resource": "https://angular.dev/tutorials" },
      { "title": "Services & DI", "detail": "Providing and injecting a service.", "minutes": 25 },
      { "title": "Reactive vs template forms", "detail": "When to use each.", "minutes": 25 }
    ]
  },
  "azure": {
    "code": [
      { "title": "Write the App Service answer", "detail": "Draft your 'why App Service' answer: managed hosting, slots, scaling, DevOps.", "minutes": 30 },
      { "title": "Key Vault + managed identity note", "detail": "Explain how App Service reads secrets from Key Vault without storing them.", "minutes": 30 },
      { "title": "Azure Functions story", "detail": "Write the HRMS approval-automation Functions story with trigger details.", "minutes": 35 }
    ],
    "learn": [
      { "title": "AZ-204 service map", "detail": "App Service, Functions, Key Vault, Blob, Azure SQL — one line each.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-204" },
      { "title": "Entra ID / OAuth basics", "detail": "AuthN vs AuthZ, OAuth2, OIDC, JWT, app registration.", "minutes": 30 },
      { "title": "Azure DevOps pipeline", "detail": "Build, release, YAML, environments, approvals.", "minutes": 30 }
    ]
  },
  "ai": {
    "code": [
      { "title": "AI report endpoint (mock)", "detail": "Design IAiReportService with AzureOpenAiReportService and MockAiReportService. Wire a mock that returns a markdown report.", "minutes": 45 },
      { "title": "Prompt + guardrails draft", "detail": "Write the system prompt and guardrails for the wellness coaching feature.", "minutes": 30 }
    ],
    "learn": [
      { "title": "Azure OpenAI vs OpenAI", "detail": "Enterprise controls, deployment names, governance.", "minutes": 30, "resource": "https://learn.microsoft.com/en-us/azure/ai-services/openai/" },
      { "title": "Tokens, context, streaming, cost", "detail": "How to control cost and latency; data privacy.", "minutes": 30 },
      { "title": "Frontend vs backend AI calls", "detail": "Why keys live on the backend; error handling and retries.", "minutes": 25 }
    ]
  },
  "systemdesign": {
    "code": [
      { "title": "Design: HRMS leave approval", "detail": "Requirements, users, APIs, tables, architecture, auth, scaling. Write it, then record a 5-min explanation.", "minutes": 45 },
      { "title": "Design: healthcare scan upload/review", "detail": "Same 8-step template. Focus on secure file storage.", "minutes": 45 },
      { "title": "Design: notification service", "detail": "Queue, retries, idempotency, logging.", "minutes": 45 }
    ],
    "learn": [
      { "title": "Design answer template", "detail": "Memorise the 8 steps: requirements → users → APIs → data → architecture → security → scale → tradeoffs.", "minutes": 25 },
      { "title": "Monolith vs microservice tradeoffs", "detail": "When each is the right call for your scale.", "minutes": 25 }
    ]
  },
  "resume": {
    "code": [
      { "title": "Resume defense drill — 1 bullet", "detail": "Pick one resume bullet. Fill: what I did / tools / problem / result / interview proof. If you cannot, rewrite the claim safer.", "minutes": 30 },
      { "title": "Write 40% SQL story details", "detail": "Which query, which index, how you found the deadlock, what tool, before/after numbers.", "minutes": 35 },
      { "title": "Pin a GitHub repo + README", "detail": "Add a real README to your Employee API or AI report repo.", "minutes": 40 }
    ],
    "learn": [
      { "title": "Fix resume/portfolio mismatch", "detail": "Align dates and version claims across resume, portfolio, LinkedIn.", "minutes": 30 },
      { "title": "Positioning statement", "detail": "Refine your 'full-stack .NET, backend-strong, AI-curious' one-liner.", "minutes": 25 }
    ]
  },
  "speaking": {
    "speak": [
      { "title": "Tell me about yourself", "detail": "Record 75 seconds. Lead with strengths, end with what you want next.", "minutes": 15 },
      { "title": "Why are you looking for change?", "detail": "Record 60 seconds. Pull toward product engineering, not away from the bench.", "minutes": 15 },
      { "title": "Explain one project (STAR)", "detail": "Pick HRMS / Healthcare / Postal / Wellness. Situation, task, action, result.", "minutes": 15 },
      { "title": "Explain today's technical topic", "detail": "Definition, example, tradeoff, resume link. Under 90 seconds.", "minutes": 15 },
      { "title": "What if you do not know an answer?", "detail": "Practice the honest pattern: 'I have not done that directly, but my understanding is...'", "minutes": 15 }
    ]
  },
  "review": {
    "learn": [
      { "title": "Weekly review", "detail": "What did I complete? What felt hard? What did I avoid? What question would expose me? Next week's one focus.", "minutes": 30 },
      { "title": "Rewrite a weak solution", "detail": "Redo one thing that felt shaky this week, from memory.", "minutes": 30 }
    ],
    "speak": [
      { "title": "Re-record your weakest answer", "detail": "Pick the answer that felt worst this week and record a cleaner version.", "minutes": 15 }
    ]
  },
  "mock": {
    "code": [
      { "title": "Coding mock (timed)", "detail": "One DSA easy/medium in 25 min. Narrate as you go. Then write what tripped you.", "minutes": 45 },
      { "title": "SQL mock", "detail": "3 queries under time pressure, explain each plan.", "minutes": 40 },
      { "title": ".NET rapid-fire", "detail": "Answer 10 core .NET questions out loud without notes.", "minutes": 35 }
    ],
    "learn": [
      { "title": "Log mock feedback", "detail": "Top 3 weak topics from today's mock. Schedule the fix within 48h.", "minutes": 20 }
    ],
    "speak": [
      { "title": "Behavioral mock", "detail": "Conflict, failure, proudest project. STAR, natural delivery.", "minutes": 15 },
      { "title": "Project defense mock", "detail": "Defend your hardest resume claim against follow-ups.", "minutes": 15 }
    ]
  }
}

````

### server\src\groq.js

````javascript
import 'dotenv/config';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// Core coaching voice — adapted from Dwarkesh's "AI Daily Coach" prompt.
const COACH_RULES = `
You are Dwarkesh's calm interview-prep coach.
- He is a 4-year .NET full-stack developer, rusty after ~10 months of low manual coding, currently on bench.
- Targets product/MNC roles in Pune/Bangalore/remote, 8-14 LPA.
- He can study max 2 hours on weekdays and struggles with consistency and confidence.
Rules: keep it simple and kind. Never guilt him for a missed day. Never overload. Always keep the daily shape to 3 things: Code, Learn, Speak. Always offer a low-energy fallback. Stay within the roadmap's current week; do not invent a brand-new syllabus.`;

async function chat(messages, { json = false, maxTokens = 700 } = {}) {
  if (!process.env.GROQ_API_KEY) {
    return { error: 'GROQ_API_KEY not set in .env' };
  }
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.5,
        max_tokens: maxTokens,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
        messages
      })
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: `Groq ${res.status}: ${text.slice(0, 300)}` };
    }
    const data = await res.json();
    return { text: data.choices?.[0]?.message?.content || '' };
  } catch (e) {
    return { error: String(e) };
  }
}

// Re-plan today's tasks given energy/mood/available time. Returns JSON tasks.
export async function replanDay({ plan, energy, mood, minutes, recentNote }) {
  const sys = `${COACH_RULES}
Return ONLY JSON, no prose, no markdown fences. Shape:
{"mode":"full|normal|low","message":"one warm sentence","tasks":[{"kind":"code|learn|speak","title":"...","detail":"...","minutes":number}]}
Keep tasks aligned to the same week/topics as the original plan. If energy is low (1-2) or minutes < 30, shrink to a single tiny doable task per kind, or fewer tasks, and set mode to "low".`;

  const user = `Original plan for today:
Week: ${plan.weekLabel}
Focus: ${plan.focus}
Tasks: ${JSON.stringify(plan.tasks)}

Today's reality:
Energy (1-5): ${energy ?? 'unknown'}
Mood (1-5): ${mood ?? 'unknown'}
Minutes available: ${minutes ?? 'unknown'}
${recentNote ? 'Recent note from him: ' + recentNote : ''}

Adjust today's 3 tasks to fit this reality. Stay on the same topics.`;

  const out = await chat([{ role: 'system', content: sys }, { role: 'user', content: user }], { json: true });
  if (out.error) return out;
  try { return { plan: JSON.parse(out.text) }; }
  catch { return { error: 'Could not parse AI response', raw: out.text }; }
}

// Feedback on a pasted learning note.
export async function noteFeedback({ topic, content }) {
  const sys = `${COACH_RULES}
He will paste notes or an answer he wrote while studying. Give SHORT, specific feedback.
Return ONLY JSON: {"feedback":"2-3 sentences, encouraging and concrete","follow_up":"one question to test if he really gets it","restudy":true|false}
Set restudy true only if the note shows a real misunderstanding.`;
  const user = `Topic: ${topic || 'unspecified'}\n\nHis note/answer:\n${content}`;
  const out = await chat([{ role: 'system', content: sys }, { role: 'user', content: user }], { json: true });
  if (out.error) return out;
  try { return JSON.parse(out.text); }
  catch { return { feedback: out.text, follow_up: '', restudy: false }; }
}

// Generate a short mock interview for the current phase.
export async function generateMock({ phase }) {
  const sys = `${COACH_RULES}
Create a SHORT mock for his current phase. Return ONLY JSON:
{"intro":"one calm sentence","questions":[{"area":"C#|SQL|Project|Behavioral","question":"...","what_good_looks_like":"one line"}]}
Exactly 4 questions: one C#/.NET, one SQL, one project, one behavioral.`;
  const user = `Current phase: ${phase || 'basics restart'}.`;
  const out = await chat([{ role: 'system', content: sys }, { role: 'user', content: user }], { json: true, maxTokens: 800 });
  if (out.error) return out;
  try { return JSON.parse(out.text); }
  catch { return { error: 'Could not parse AI response', raw: out.text }; }
}

````

### server\src\index.js

````javascript
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import todayRoutes from './routes/today.js';
import aiRoutes from './routes/ai.js';
import dataRoutes from './routes/data.js';
import { roadmapMeta } from './planner.js';
import { hasSupabaseConfig } from './supabase.js';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));

// Simple shared-secret guard. Frontend sends `x-app-passcode`.
// Set APP_PASSCODE in .env. Leave it unset only for pure local testing.
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();   // CORS preflight
  if (req.path === '/api/health') return next();
  const need = process.env.APP_PASSCODE;
  if (!need) return next();
  if (req.get('x-app-passcode') === need) return next();
  return res.status(401).json({ error: 'Unauthorized' });
});

app.get('/api/health', (req, res) => res.json({
  ok: true,
  plan: roadmapMeta.title,
  config: {
    database: hasSupabaseConfig,
    ai: Boolean(process.env.GROQ_API_KEY),
    passcode: Boolean(process.env.APP_PASSCODE)
  }
}));

app.use('/api', todayRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', dataRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Interview Mentor API running on http://localhost:${PORT}`);
  if (!process.env.SUPABASE_URL) console.log('  ! Set SUPABASE_URL / SUPABASE_SERVICE_KEY in server/.env');
  if (!process.env.GROQ_API_KEY) console.log('  ! Set GROQ_API_KEY in server/.env for AI features');
  if (!process.env.APP_PASSCODE) console.log('  ! APP_PASSCODE is empty — API is open. Set one before deploying.');
});

````

### server\src\notion.js

````javascript
import 'dotenv/config';

const NOTION_VERSION = '2022-06-28';
const token = () => process.env.NOTION_TOKEN;

async function notion(path, method = 'POST', body) {
  if (!token()) return { skipped: true, reason: 'NOTION_TOKEN not set' };
  try {
    const res = await fetch(`https://api.notion.com/v1/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token()}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) return { error: `Notion ${res.status}: ${data.message || ''}` };
    return { data };
  } catch (e) {
    return { error: String(e) };
  }
}

const title = (t) => ({ title: [{ text: { content: String(t || '').slice(0, 1900) } }] });
const rich  = (t) => ({ rich_text: [{ text: { content: String(t || '').slice(0, 1900) } }] });
const num   = (n) => (n == null ? { number: null } : { number: Number(n) });
const date  = (d) => (d ? { date: { start: d } } : { date: null });
const select = (s) => (s ? { select: { name: String(s).slice(0, 90) } } : { select: null });

// Push one day's summary into the Daily Tracker DB.
export async function syncDailyLog({ the_date, mode, status, energy, mood, summary }) {
  const db = process.env.NOTION_DAILY_DB_ID;
  if (!db) return { skipped: true, reason: 'NOTION_DAILY_DB_ID not set' };
  return notion('pages', 'POST', {
    parent: { database_id: db },
    properties: {
      Date: { ...title(the_date) },
      When: date(the_date),
      Mode: select(mode),
      Status: select(status),
      Energy: num(energy),
      Mood: num(mood),
      Summary: rich(summary)
    }
  });
}

export async function syncQuestion(q) {
  const db = process.env.NOTION_QUESTIONS_DB_ID;
  if (!db) return { skipped: true, reason: 'NOTION_QUESTIONS_DB_ID not set' };
  return notion('pages', 'POST', {
    parent: { database_id: db },
    properties: {
      Question: { ...title(q.question) },
      Topic: select(q.topic),
      Difficulty: select(q.difficulty),
      Status: select(q.status),
      Answer: rich(q.my_answer)
    }
  });
}

export async function syncApplication(a) {
  const db = process.env.NOTION_APPLICATIONS_DB_ID;
  if (!db) return { skipped: true, reason: 'NOTION_APPLICATIONS_DB_ID not set' };
  return notion('pages', 'POST', {
    parent: { database_id: db },
    properties: {
      Company: { ...title(a.company) },
      Role: rich(a.role),
      Location: rich(a.location),
      Source: select(a.source),
      Status: select(a.status),
      Applied: date(a.applied_date)
    }
  });
}

````

### server\src\planner.js

````javascript
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const roadmap = JSON.parse(readFileSync(join(__dirname, 'data', 'roadmap.json'), 'utf-8'));
const bank = JSON.parse(readFileSync(join(__dirname, 'data', 'taskBank.json'), 'utf-8'));

const START = process.env.PLAN_START_DATE || '2026-06-17';
const TZ = process.env.TIMEZONE || 'Asia/Kolkata';

// --- date helpers (date-only, no time zone math beyond the day) ---
export function todayDate() {
  // Calendar date in the configured timezone. en-CA formats as YYYY-MM-DD.
  // This keeps "today" correct for late-night use (UTC would roll over early).
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

export function dayIndexFor(dateStr) {
  const start = new Date(START + 'T00:00:00');
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.floor((d - start) / 86400000);
  return diff + 1; // day 1 == start date
}

function weekdayTopics(dateStr) {
  const wd = new Date(dateStr + 'T00:00:00').getDay(); // 0 Sun .. 6 Sat
  return roadmap.weekdayFocus[String(wd)] || roadmap.weekdayFocus['1'];
}

function phaseForDay(dayIndex) {
  return roadmap.phases.find(p => dayIndex >= p.startDay && dayIndex <= p.endDay) || null;
}

// Deterministic pick so the same day always yields the same task,
// but well-spread across consecutive days (Knuth multiplicative hash).
function pick(arr, seed) {
  if (!arr || arr.length === 0) return null;
  const h = (Math.imul(seed >>> 0, 2654435761) >>> 0);
  return arr[h % arr.length];
}

function firstTopicWithKind(topics, kind, seed) {
  for (const t of topics) {
    const pool = bank[t] && bank[t][kind];
    if (pool && pool.length) {
      const item = pick(pool, seed);
      return { topic: t, ...item, kind };
    }
  }
  return null;
}

// Build the 3 tasks (code/learn/speak) for a generated day (>=15).
function generateTasks(dayIndex, dateStr) {
  const phase = phaseForDay(dayIndex);
  const wd = weekdayTopics(dateStr);
  const seed = dayIndex;

  // Topic priority: weekday focus first, then phase topics, then sensible fallbacks.
  const codeTopics  = [...wd.topics, ...(phase ? phase.topics : []), 'csharp', 'sql', 'dotnet', 'dsa'];
  const learnTopics = [...wd.topics, ...(phase ? phase.topics : []), 'dotnet', 'sql', 'csharp'];

  const code  = firstTopicWithKind(codeTopics, 'code', seed)
             || firstTopicWithKind(codeTopics, 'speak', seed); // review/mock days may only have speak
  const learn = firstTopicWithKind(learnTopics, 'learn', seed + 1);
  const speakPool = bank.speaking.speak || [];
  const speak = speakPool.length ? speakPool[dayIndex % speakPool.length] : null; // clean rotation

  const tasks = [];
  if (code)  tasks.push({ kind: code.kind || 'code', title: code.title, detail: code.detail, resource_url: code.resource || '', minutes: code.minutes || 35 });
  if (learn) tasks.push({ kind: 'learn', title: learn.title, detail: learn.detail, resource_url: learn.resource || '', minutes: learn.minutes || 30 });
  if (speak) tasks.push({ kind: 'speak', title: speak.title, detail: speak.detail, resource_url: '', minutes: speak.minutes || 15 });
  return tasks;
}

// Public: full plan for a date — labels + tasks. status/mode come from DB elsewhere.
export function planForDate(dateStr) {
  const dayIndex = dayIndexFor(dateStr);

  if (dayIndex < 1) {
    return { dayIndex, beforeStart: true, weekLabel: 'Plan not started yet', phase: '', focus: 'Your plan begins on ' + START, tasks: [] };
  }

  // Explicit rehabilitation days 1-14
  const explicit = roadmap.explicitDays.find(d => d.day === dayIndex);
  if (explicit) {
    return {
      dayIndex,
      weekLabel: dayIndex <= 7 ? 'Week 1 — Programming restart' : 'Week 2 — Basics, SQL & first mock',
      phase: explicit.title,
      focus: 'Rehabilitation day. Restart the machine, do not judge yourself.',
      defaultMode: explicit.defaultMode || 'normal',
      tasks: explicit.tasks.map(t => ({ kind: t.kind, title: t.title, detail: t.detail, resource_url: t.resource || '', minutes: t.minutes }))
    };
  }

  // Generated days 15..90
  const phase = phaseForDay(dayIndex);
  const wd = weekdayTopics(dateStr);
  return {
    dayIndex,
    weekLabel: phase ? `Week ${phase.week} — ${phase.name}` : 'Beyond the 90-day plan',
    phase: phase ? phase.name : 'Maintenance',
    focus: phase ? `${phase.focus} (Today: ${wd.name}.)` : 'Keep your reps and applications going.',
    defaultMode: 'normal',
    tasks: generateTasks(dayIndex, dateStr)
  };
}

export const roadmapMeta = roadmap.meta;
export const consistencyRules = roadmap.consistencyRules;
export const modes = roadmap.modes;
export const phases = roadmap.phases;

````

### server\src\routes\ai.js

````javascript
import { Router } from 'express';
import { requireSupabase, supabase } from '../supabase.js';
import { planForDate, todayDate } from '../planner.js';
import { replanDay, noteFeedback, generateMock } from '../groq.js';

const router = Router();

// Re-plan today's tasks with AI, then REPLACE today's tasks in the DB.
router.post('/replan', requireSupabase, async (req, res) => {
  try {
    const dateStr = req.body.date || todayDate();
    const { energy, mood, minutes, recentNote } = req.body;

    const { data: day } = await supabase.from('days').select('*').eq('the_date', dateStr).maybeSingle();
    if (!day) return res.status(400).json({ error: 'Load today first.' });

    const plan = { weekLabel: day.week_label, focus: day.focus, tasks: (await supabase.from('tasks').select('kind,title,detail,minutes').eq('day_id', day.id)).data || [] };

    const out = await replanDay({ plan, energy, mood, minutes, recentNote });
    if (out.error) return res.status(502).json(out);

    // Sanitize whatever the model returned before it ever touches the DB.
    const ALLOWED = ['code', 'learn', 'speak'];
    const clean = (out.plan?.tasks || [])
      .filter(t => t && t.title && String(t.title).trim())
      .slice(0, 6)
      .map((t, i) => ({
        day_id: day.id,
        kind: ALLOWED.includes(t.kind) ? t.kind : 'learn',
        title: String(t.title).slice(0, 300),
        detail: t.detail ? String(t.detail).slice(0, 1500) : '',
        minutes: Number.isFinite(Number(t.minutes)) ? Number(t.minutes) : null,
        position: i,
        resource_url: ''
      }));

    // If the AI gave nothing usable, keep the original plan instead of wiping it.
    if (clean.length === 0) {
      const { data: kept } = await supabase.from('tasks').select('*').eq('day_id', day.id).order('position');
      return res.json({ message: "Kept your original plan — the AI didn't return usable tasks. Try again in a moment.", mode: day.mode, tasks: kept || [] });
    }

    await supabase.from('tasks').delete().eq('day_id', day.id);
    await supabase.from('tasks').insert(clean);
    await supabase.from('days').update({ was_replanned: true, mode: out.plan.mode || day.mode }).eq('id', day.id);

    const { data: tasks } = await supabase.from('tasks').select('*').eq('day_id', day.id).order('position');
    res.json({ message: out.plan.message || 'Re-planned for today.', mode: out.plan.mode || day.mode, tasks });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// Submit a learning note, get AI feedback, save it.
router.post('/note', requireSupabase, async (req, res) => {
  try {
    const { topic, content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Empty note.' });

    const fb = await noteFeedback({ topic, content });
    const row = {
      topic: topic || null,
      content,
      ai_feedback: fb.error ? null : (fb.feedback || null),
      follow_up: fb.follow_up || null,
      restudy_flag: !!fb.restudy
    };
    const { data, error } = await supabase.from('notes').insert(row).select().single();
    if (error) throw error;
    res.json({ note: data, aiError: fb.error || null });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

router.get('/notes', requireSupabase, async (req, res) => {
  const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false }).limit(30);
  res.json({ notes: data || [] });
});

// Generate a short mock for the current phase.
router.post('/mock', async (req, res) => {
  try {
    const dateStr = req.body.date || todayDate();
    const plan = planForDate(dateStr);
    const out = await generateMock({ phase: plan.phase });
    if (out.error) return res.status(502).json(out);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

export default router;

````

### server\src\routes\data.js

````javascript
import { Router } from 'express';
import { requireSupabase, supabase } from '../supabase.js';
import { phases, consistencyRules } from '../planner.js';
import { syncQuestion, syncApplication } from '../notion.js';

const router = Router();

// ---------- generic helpers ----------
function crud(table, { syncFn } = {}) {
  const r = Router();
  r.get('/', async (req, res) => {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ items: data || [] });
  });
  r.post('/', async (req, res) => {
    const { data, error } = await supabase.from(table).insert(req.body).select().single();
    if (error) return res.status(500).json({ error: error.message });
    if (syncFn) syncFn(data).catch(() => {});
    res.json({ item: data });
  });
  r.put('/:id', async (req, res) => {
    const { data, error } = await supabase.from(table).update(req.body).eq('id', req.params.id).select().maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json({ item: data });
  });
  r.delete('/:id', async (req, res) => {
    const { error } = await supabase.from(table).delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  });
  return r;
}

router.use('/questions', requireSupabase, crud('questions', { syncFn: syncQuestion }));
router.use('/applications', requireSupabase, crud('applications', { syncFn: syncApplication }));
router.use('/recordings', requireSupabase, crud('recordings'));

// ---------- roadmap (read-only view) ----------
router.get('/roadmap', (req, res) => {
  res.json({ phases, consistencyRules });
});

// ---------- progress / streak ----------
router.get('/progress', requireSupabase, async (req, res) => {
  try {
    const { data: days } = await supabase.from('days').select('the_date, mode, status').order('the_date');
    const points = { full: 3, normal: 2, low: 1 };
    let total = 0;
    const series = (days || []).map(d => {
      const p = d.status === 'skipped' || d.status === 'pending' ? 0 : (points[d.mode] || 0);
      total += p;
      return { date: d.the_date, points: p, mode: d.mode, status: d.status };
    });

    // current streak: consecutive most-recent days that were not skipped/zero
    let streak = 0;
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i].points > 0) streak++; else break;
    }

    const { count: questionsCount } = await supabase.from('questions').select('*', { count: 'exact', head: true });
    const { count: canAnswer } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'Can Answer');
    const { count: apps } = await supabase.from('applications').select('*', { count: 'exact', head: true });

    res.json({
      totalPoints: total,
      streak,
      daysEngaged: series.filter(s => s.points > 0).length,
      series,
      questionsCount: questionsCount || 0,
      canAnswer: canAnswer || 0,
      applications: apps || 0
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

export default router;

````

### server\src\routes\today.js

````javascript
import { Router } from 'express';
import { requireSupabase, supabase } from '../supabase.js';
import { planForDate, todayDate, modes } from '../planner.js';
import { syncDailyLog } from '../notion.js';

const router = Router();
router.use(requireSupabase);

// Ensure a day row + its tasks exist in the DB for the given date.
// Written to be safe against two requests arriving at once (e.g. React
// StrictMode double-mounting in dev), which would otherwise hit the unique
// constraint on days.the_date and/or duplicate tasks.
async function ensureDay(dateStr) {
  const plan = planForDate(dateStr);
  let { data: day } = await supabase.from('days').select('*').eq('the_date', dateStr).maybeSingle();

  if (!day) {
    const insert = {
      day_index: plan.dayIndex,
      the_date: dateStr,
      week_label: plan.weekLabel,
      phase: plan.phase,
      focus: plan.focus,
      mode: plan.defaultMode || 'normal',
      status: 'pending'
    };
    const { data: created, error: insErr } = await supabase.from('days').insert(insert).select().maybeSingle();

    if (insErr || !created) {
      // Most likely a concurrent request already created this day. Re-fetch it.
      const again = await supabase.from('days').select('*').eq('the_date', dateStr).maybeSingle();
      day = again.data;
      if (!day) throw insErr || new Error('Could not create or load the day');
    } else {
      day = created;
      // Only the request that actually created the day seeds its tasks,
      // so concurrent loads can never produce duplicate tasks.
      if (plan.tasks?.length) {
        const rows = plan.tasks.map((t, i) => ({
          day_id: day.id, kind: t.kind, title: t.title, detail: t.detail,
          resource_url: t.resource_url || '', minutes: t.minutes || null, position: i
        }));
        await supabase.from('tasks').insert(rows);
      }
    }
  }

  const { data: tasks } = await supabase.from('tasks').select('*').eq('day_id', day.id).order('position');
  const { data: log } = await supabase.from('logs').select('*').eq('the_date', dateStr).maybeSingle();
  return { day, tasks: tasks || [], log: log || null, plan };
}

router.get('/today', async (req, res) => {
  try {
    const dateStr = req.query.date || todayDate();
    const result = await ensureDay(dateStr);
    res.json({ ...result, modes });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// Toggle a single task done/undone.
router.post('/task/:id/toggle', async (req, res) => {
  try {
    const id = req.params.id;
    const { data: t } = await supabase.from('tasks').select('done').eq('id', id).maybeSingle();
    if (!t) return res.status(404).json({ error: 'Task not found' });
    const next = !t.done;
    const { data, error } = await supabase.from('tasks')
      .update({ done: next, done_at: next ? new Date().toISOString() : null })
      .eq('id', id).select().maybeSingle();
    if (error) throw error;
    res.json({ task: data });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// Set the day's mode (full/normal/low).
router.post('/day/mode', async (req, res) => {
  try {
    const { date, mode } = req.body;
    const { error } = await supabase.from('days').update({ mode }).eq('the_date', date || todayDate());
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// Save the daily check-in log (upsert by date).
router.post('/log', async (req, res) => {
  try {
    const dateStr = req.body.date || todayDate();
    const row = {
      the_date: dateStr,
      energy: req.body.energy ?? null,
      mood: req.body.mood ?? null,
      what_felt_hard: req.body.what_felt_hard || null,
      what_avoided: req.body.what_avoided || null,
      minutes_tomorrow: req.body.minutes_tomorrow ?? null
    };
    const { data, error } = await supabase.from('logs').upsert(row, { onConflict: 'the_date' }).select().single();
    if (error) throw error;
    res.json({ log: data });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// Mark the day's status (done / rest / skipped) and sync a summary to Notion.
router.post('/day/status', async (req, res) => {
  try {
    const dateStr = req.body.date || todayDate();
    const status = req.body.status || 'done';
    const { data: day, error } = await supabase.from('days').update({ status }).eq('the_date', dateStr).select().maybeSingle();
    if (error) throw error;
    if (!day) return res.status(404).json({ error: 'No day to update yet. Open Today first.' });

    const { data: tasks } = await supabase.from('tasks').select('*').eq('day_id', day.id);
    const { data: log } = await supabase.from('logs').select('*').eq('the_date', dateStr).maybeSingle();
    const doneCount = (tasks || []).filter(t => t.done).length;
    const summary = `${doneCount}/${(tasks || []).length} tasks done. ${day.phase || ''}`.trim();

    // Fire-and-forget Notion sync (does nothing if Notion not configured).
    syncDailyLog({
      the_date: dateStr, mode: day.mode, status,
      energy: log?.energy, mood: log?.mood, summary
    }).catch(() => {});

    res.json({ day, synced: !!process.env.NOTION_DAILY_DB_ID });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

export default router;

````

### server\src\setup-notion.js

````javascript
// One-time: creates 3 Notion databases under NOTION_PARENT_PAGE_ID and prints their IDs.
// Usage: set NOTION_TOKEN + NOTION_PARENT_PAGE_ID in .env, then: npm run setup-notion
// Then paste the printed IDs into .env (NOTION_DAILY_DB_ID, etc.).
import 'dotenv/config';

const NOTION_VERSION = '2022-06-28';
const token = process.env.NOTION_TOKEN;
const parent = process.env.NOTION_PARENT_PAGE_ID;

if (!token || !parent) {
  console.error('Set NOTION_TOKEN and NOTION_PARENT_PAGE_ID in server/.env first.');
  console.error('Get a page ID from the page URL (the 32-char id at the end). Share that page with your integration.');
  process.exit(1);
}

async function createDb(title, properties) {
  const res = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' },
    body: JSON.stringify({ parent: { type: 'page_id', page_id: parent }, title: [{ text: { content: title } }], properties })
  });
  const data = await res.json();
  if (!res.ok) { console.error(`Failed to create "${title}":`, data.message); return null; }
  return data.id;
}

const sel = (opts) => ({ select: { options: opts.map(name => ({ name })) } });

const run = async () => {
  const daily = await createDb('Interview Rebuild — Daily Tracker', {
    Date: { title: {} },
    When: { date: {} },
    Mode: sel(['full', 'normal', 'low']),
    Status: sel(['pending', 'done', 'rest', 'skipped']),
    Energy: { number: {} },
    Mood: { number: {} },
    Summary: { rich_text: {} }
  });

  const questions = await createDb('Interview Question Bank', {
    Question: { title: {} },
    Topic: sel(['C#', '.NET', 'SQL', 'DSA', 'Azure', 'AI', 'React', 'Angular', 'Behavioral', 'Project']),
    Difficulty: sel(['Easy', 'Medium', 'Hard']),
    Status: sel(['New', 'Learning', 'Can Answer', 'Mock Passed']),
    Answer: { rich_text: {} }
  });

  const applications = await createDb('Job Applications', {
    Company: { title: {} },
    Role: { rich_text: {} },
    Location: { rich_text: {} },
    Source: sel(['LinkedIn', 'Naukri', 'Instahyre', 'Wellfound', 'Referral', 'Career page']),
    Status: sel(['Applied', 'Screen', 'Tech', 'Final', 'Offer', 'Rejected']),
    Applied: { date: {} }
  });

  console.log('\nDone. Paste these into server/.env:\n');
  console.log('NOTION_DAILY_DB_ID=' + (daily || ''));
  console.log('NOTION_QUESTIONS_DB_ID=' + (questions || ''));
  console.log('NOTION_APPLICATIONS_DB_ID=' + (applications || ''));
};

run();

````

### server\src\supabase.js

````javascript
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
export const hasSupabaseConfig = Boolean(url && key);

if (!url || !key) {
  console.warn('[supabase] SUPABASE_URL / SUPABASE_SERVICE_KEY missing. DB calls will fail until set in .env');
}

export const supabase = createClient(url || 'http://localhost', key || 'missing', {
  auth: { persistSession: false }
});

export function requireSupabase(req, res, next) {
  if (hasSupabaseConfig) return next();
  return res.status(503).json({
    error: 'Database is not configured yet. Create server/.env from server/.env.example, then set SUPABASE_URL and SUPABASE_SERVICE_KEY.'
  });
}

````
