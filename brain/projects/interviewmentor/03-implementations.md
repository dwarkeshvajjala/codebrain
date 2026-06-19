# interviewMentor - Key Implementations

## Shared API Wrapper

All frontend calls go through one function that adds JSON headers and the passcode.

```javascript
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const PASSCODE = import.meta.env.VITE_APP_PASSCODE || '';

async function req(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-app-passcode': PASSCODE
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
```

## Backend Passcode Guard

The API is single-user and uses a simple shared secret. Health checks bypass it.

```javascript
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();   // CORS preflight
  if (req.path === '/api/health') return next();
  const need = process.env.APP_PASSCODE;
  if (!need) return next();
  if (req.get('x-app-passcode') === need) return next();
  return res.status(401).json({ error: 'Unauthorized' });
});
```

## Lazy Day Seeding

Opening Today creates the day row and tasks if they do not already exist.
The insert path handles React StrictMode-style duplicate requests.

```javascript
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
      const again = await supabase.from('days').select('*').eq('the_date', dateStr).maybeSingle();
      day = again.data;
      if (!day) throw insErr || new Error('Could not create or load the day');
    } else {
      day = created;
      if (plan.tasks?.length) {
        const rows = plan.tasks.map((t, i) => ({
          day_id: day.id, kind: t.kind, title: t.title, detail: t.detail,
          resource_url: t.resource_url || '', minutes: t.minutes || null, position: i
        }));
        await supabase.from('tasks').insert(rows);
      }
    }
  }
```

## Deterministic Generated Tasks

Days 15+ combine weekday focus, phase topics, and task-bank fallbacks.

```javascript
function generateTasks(dayIndex, dateStr) {
  const phase = phaseForDay(dayIndex);
  const wd = weekdayTopics(dateStr);
  const seed = dayIndex;

  const codeTopics  = [...wd.topics, ...(phase ? phase.topics : []), 'csharp', 'sql', 'dotnet', 'dsa'];
  const learnTopics = [...wd.topics, ...(phase ? phase.topics : []), 'dotnet', 'sql', 'csharp'];

  const code  = firstTopicWithKind(codeTopics, 'code', seed)
             || firstTopicWithKind(codeTopics, 'speak', seed);
  const learn = firstTopicWithKind(learnTopics, 'learn', seed + 1);
  const speakPool = bank.speaking.speak || [];
  const speak = speakPool.length ? speakPool[dayIndex % speakPool.length] : null;
```

## Groq Wrapper

The backend keeps the Groq key private and supports JSON-mode responses.

```javascript
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
```

## AI Re-plan Sanitization

Model output is trimmed and normalized before replacing tasks.

```javascript
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
```

## Generic CRUD Route Factory

Questions, applications, and recordings share a small CRUD router.

```javascript
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
```
