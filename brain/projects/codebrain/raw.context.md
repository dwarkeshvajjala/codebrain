# Project Context: codeBrain

- Generated: 2026-06-20T14:43:39.404Z
- Source path: D:\AI\codeBrain
- Git URL: https://github.com/dwarkeshvajjala/codebrain.git
- Files included: 25
- Files skipped (> 80 KB): 1

## Detected stack & packages

### npm - package.json
**name** code-brain

## File type breakdown

- .md: 15
- .js: 7
- (none): 2
- .json: 1

## File tree

```
|-- .gitignore
|-- SETUP.md
|-- brain
|   |-- README.md
|   |-- ideas
|   |   `-- _TEMPLATE.md
|   |-- patterns
|   |   |-- README.md
|   |   `-- _TEMPLATE.md
|   `-- projects
|       |-- .gitkeep
|       |-- codebrain
|       |   |-- 00-overview.md
|       |   |-- 01-architecture.md
|       |   |-- 02-packages.md
|       |   |-- 03-implementations.md
|       |   `-- 04-gotchas.md
|       `-- interviewmentor
|           |-- 00-overview.md
|           |-- 01-architecture.md
|           |-- 02-packages.md
|           |-- 03-implementations.md
|           `-- 04-gotchas.md
|-- package.json
`-- scripts
    |-- brain-all.js
    |-- brain-bundle.js
    |-- brain-import.js
    |-- brain-refine.js
    |-- brain-ui.js
    |-- load-env.js
    `-- new-idea.js
```

## Skipped large files

- brain\index.html (241 KB)

## Source files

### .gitignore

````
# staging for batch runs (context files are regenerated)
brain/_staging/
brain/_repos/

# secrets
.env
*.env

# node
node_modules/

# OS
.DS_Store
Thumbs.db

````

### brain\ideas\_TEMPLATE.md

````markdown
# <idea title>

## Problem / why
- 

## Core idea
- 

## Suggested stack
- 

## Build phases
- Phase 1: 
- Phase 2: 

## Reuse from existing projects
- 

## Risks / open questions
- 

## First concrete step
- 

````

### brain\patterns\_TEMPLATE.md

````markdown
# Pattern: <name>

> A reusable approach you keep needing across projects. Write these by hand — they become your highest-value layer.

## Problem it solves
- 

## When to use it
- 

## Working code
```text
// paste the real, tested snippet here
```

## Gotchas
- 

## Used in
- <project> (link to projects/<project>/03-implementations.md)

````

### brain\patterns\README.md

````markdown
# Patterns

Cross-project reusable solutions. Unlike `projects/` (auto-generated), write these by hand when you notice you've solved the same thing twice.

Good candidates from your stack:
- `auth-jwt-httponly.md` — JWT access + HttpOnly refresh token flow
- `nl2sql-groq.md` — natural-language-to-SQL with Groq
- `supabase-realtime.md` — live updates (e.g. seat maps)
- `magic-link-auth.md` — passwordless candidate login
- `groq-whisper-transcription.md` — audio → text

Copy `_TEMPLATE.md` to start a new one.

````

### brain\projects\.gitkeep

````

````

### brain\projects\codebrain\00-overview.md

````markdown
# codeBrain - Overview

- Personal code-memory tool that turns repos into structured markdown knowledge.
- Primary workflow: import a GitHub repo or local folder, bundle source context, refine it with Groq, then browse/upload the generated markdown.
- Tech stack: dependency-free Node.js scripts, Markdown files, generated static HTML dashboard.
- Storage model: `brain/projects/<project>/` holds the useful project notes; `_staging` and `_repos` are generated cache folders.
- UI model: `brain/index.html` is regenerated from local markdown and can be opened directly or served locally.
- Status: functional CLI pipeline with GitHub import, local `.env` loading, bundle-only fallback, AI refine, dashboard generation, ideas, and patterns.
- Git URL: https://github.com/dwarkeshvajjala/codebrain.git

## Main Commands

- `npm run import -- https://github.com/owner/repo`: clone/update, bundle, refine, and rebuild dashboard.
- `npm run import -- . --maxchars 30000 --maxkb 80`: import the current local repo with a smaller Groq context.
- `npm run import -- <repo> --bundle-only`: create raw context without Groq.
- `npm run ui`: regenerate `brain/index.html`.
- `npm run bundle -- <repo>`: create one raw context markdown file.
- `npm run refine -- <context.md>`: turn raw context into five brain markdown files.
- `npm run idea -- "Idea title"`: create a new idea plan using existing brain context.

## Generated Project Files

- `00-overview.md`
- `01-architecture.md`
- `02-packages.md`
- `03-implementations.md`
- `04-gotchas.md`
- `raw.context.md`

````

### brain\projects\codebrain\01-architecture.md

````markdown
# codeBrain - Architecture

## Folder Layout

- `scripts/`: all executable CLI tools.
- `scripts/brain-import.js`: highest-level entry point for GitHub URLs and local folders.
- `scripts/brain-bundle.js`: walks a repo and writes one source-context markdown file.
- `scripts/brain-refine.js`: sends bundled context to Groq and writes project notes.
- `scripts/brain-ui.js`: reads `brain/projects/*` and generates the dashboard.
- `scripts/brain-all.js`: batch pipeline for every repo under one parent folder.
- `scripts/new-idea.js`: creates idea documents under `brain/ideas/`.
- `scripts/load-env.js`: minimal dependency-free `.env` loader.
- `brain/projects/`: one generated knowledge folder per project.
- `brain/patterns/`: hand-written reusable implementation patterns.
- `brain/ideas/`: dated idea plans.
- `brain/index.html`: generated static dashboard.
- `SETUP.md`: user-facing operating guide.

## Pipeline Flow

```text
GitHub URL or local repo
  -> brain-import.js
  -> brain-bundle.js
  -> brain/_staging/<repo>.context.md
  -> brain-refine.js + Groq
  -> brain/projects/<repo>/00..04.md + raw.context.md
  -> brain-ui.js
  -> brain/README.md + brain/index.html
```

## Bundle-Only Flow

```text
GitHub URL or local repo
  -> brain-import.js --bundle-only
  -> brain-bundle.js
  -> brain/projects/<repo>/raw.context.md
  -> fallback 00-overview.md
  -> brain-ui.js
```

## Data Boundaries

- Real secrets belong only in local `.env`.
- `.env.example` is tracked and safe to commit.
- `brain/_repos/` caches cloned GitHub repos and is ignored.
- `brain/_staging/` stores regenerated context files and is ignored.
- The useful project knowledge is committed under `brain/projects/`.

````

### brain\projects\codebrain\02-packages.md

````markdown
# codeBrain - Packages

## Runtime Dependencies

- No npm runtime dependencies.
- The project intentionally uses Node built-ins only:
  - `fs` for file reads/writes.
  - `path` for cross-platform paths.
  - `child_process` for calling Git and local scripts.
  - built-in `fetch` for Groq API calls.

## External Tools

- `git`: required for cloning/updating GitHub repositories.
- Node.js 18+: required because scripts rely on built-in `fetch`.
- Groq API: required for AI refinement and idea generation.

## Why This Matters

- Setup stays simple: clone repo, set `.env`, run npm scripts.
- The dashboard is static HTML, so there is no dev server or frontend build step.
- No package install is required unless future work adds a real web app/server.

````

### brain\projects\codebrain\03-implementations.md

````markdown
# codeBrain - Key Implementations

## GitHub Import Orchestrator

`brain-import.js` accepts either a GitHub URL or a local folder. GitHub repos are cached under `brain/_repos/`; local folders are bundled directly.

```javascript
if (isGithubUrl(source)) {
  repoDir = path.join(repoCacheDir, slug);
  if (fresh && fs.existsSync(repoDir)) {
    fs.rmSync(repoDir, { recursive: true, force: true });
  }
  if (fs.existsSync(path.join(repoDir, '.git'))) {
    console.log(`Updating cached repo: ${repoDir}`);
    run('git', ['-C', repoDir, 'pull', '--ff-only']);
  } else {
    if (fs.existsSync(repoDir)) fs.rmSync(repoDir, { recursive: true, force: true });
    console.log(`Cloning ${source} -> ${repoDir}`);
    run('git', ['clone', '--depth', '1', source, repoDir]);
  }
}
```

## Bundle-Only Fallback

When Groq is not configured, import still creates a useful project folder with `raw.context.md` and a minimal overview.

```javascript
if (bundleOnly) {
  const projectDir = path.join(brainDir, 'projects', slug);
  fs.mkdirSync(projectDir, { recursive: true });
  fs.copyFileSync(contextPath, path.join(projectDir, 'raw.context.md'));
  const overviewPath = path.join(projectDir, '00-overview.md');
  if (!fs.existsSync(overviewPath)) {
    fs.writeFileSync(overviewPath, `# ${slug} - Overview

- Bundle-only import from ${source}.
- Run \`npm run import -- ${source}\` with \`GROQ_API_KEY\` set to generate architecture, package, implementation, and gotcha notes.
- Git URL: ${isGithubUrl(source) ? source : 'TODO'}
`);
  }
}
```

## Source Bundling

`brain-bundle.js` skips common generated folders, large files, secrets, binary assets, and prior context files.

```javascript
const EXCLUDED_DIRS = new Set([
  'node_modules', 'bin', 'obj', 'dist', 'build', 'out', '.next', '.nuxt',
  '.turbo', '.cache', '.git', '.vs', '.vscode', '.idea', '.svelte-kit',
  'vendor', '__pycache__', '.pytest_cache', 'target', 'Pods', 'DerivedData',
  'coverage', '_repos', '_staging'
]);
```

## Git URL Capture

The bundler records either the import source URL or the repo's `origin` remote, so refined docs can cite the source.

```javascript
function detectGitUrl() {
  if (sourceUrl) return sourceUrl;
  try {
    return execFileSync('git', ['-C', ROOT, 'config', '--get', 'remote.origin.url'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'TODO';
  }
}
```

## Local `.env` Loading

`load-env.js` avoids a dependency on `dotenv` while letting scripts read local secrets safely.

```javascript
function loadEnv(file = path.resolve('.env')) {
  if (!fs.existsSync(file)) return;

  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = value;
  }
}
```

## Dashboard Generation

`brain-ui.js` loads each project folder, extracts markdown sections, and embeds the data into a single static HTML file.

```javascript
function loadProjects() {
  const projectsDir = path.join(brainDir, 'projects');
  if (!fs.existsSync(projectsDir)) return [];

  return fs.readdirSync(projectsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const projectDir = path.join(projectsDir, entry.name);
      const sections = {};
      for (const [fileKey, label] of SECTION_FILES) {
        const filename = fileKey === 'raw.context' ? 'raw.context.md' : `${fileKey}.md`;
        const content = readIfExists(path.join(projectDir, filename));
        if (content) sections[fileKey] = { label, content };
      }
      return { slug: entry.name, sections };
    });
}
```

````

### brain\projects\codebrain\04-gotchas.md

````markdown
# codeBrain - Decisions & Gotchas

## Decisions

- Keep the project dependency-free so it works immediately after cloning.
- Store the knowledge base as markdown first; this keeps it portable for Claude Projects, GitHub, and future RAG ingestion.
- Generate `brain/index.html` as a static dashboard instead of running a frontend app.
- Keep real repo clones under `brain/_repos/` so repeated GitHub imports can update instead of recloning.
- Keep raw bundle files under `brain/_staging/` so expensive context files can be regenerated.
- Track `.env.example`, but never track real `.env`.

## Gotchas

- Groq free/on-demand tiers may reject large contexts. Use `--maxchars 30000` or lower if you hit token limits.
- `--bundle-only` is useful when you do not have a key, but it creates only raw context plus a minimal overview.
- If you import the current `codeBrain` repo, use a smaller `--maxkb` so generated dashboard files do not dominate the context.
- The dashboard searches project markdown content, not only project names, so broad terms may match more projects than expected.
- `brain/index.html` is generated. Edit `scripts/brain-ui.js`, then run `npm run ui`.
- `brain/README.md` is generated. It will be overwritten by refine/import/UI commands.
- GitHub privacy cannot be changed by these scripts; use GitHub settings, GitHub CLI, or the GitHub API with an admin token.

## Safe Secret Handling

- Put the real Groq key only in local `.env`.
- Commit `.env.example`, not `.env`.
- Before pushing, run:

```bash
rg "GROQ_API_KEY|your_groq_key_here" -n .
git status --short
```

````

### brain\projects\interviewmentor\00-overview.md

````markdown
# interviewMentor - Overview

- Personal interview-prep coach named Mentor.
- Daily driver gives 3 tasks: Code, Learn, Speak.
- Tracks daily completion, energy/mood, learning notes, questions, applications, speaking practice, and progress.
- Tech stack: React 18 + Vite client, Express backend, Supabase Postgres, Groq chat completions, optional Notion REST sync.
- Source of truth: Supabase. Notion is a one-way reading/notes layer.
- Secrets stay on the backend. The frontend sends a light `x-app-passcode` header.
- Status: functional six-tab app; README says the tabs talk to a real backend and are not mocks.
- Git URL: TODO

## Main Screens

- `Today`: load or seed the day, choose mode, record energy/mood, toggle tasks, send notes, re-plan with AI, close the day.
- `Roadmap`: reads the 90-day spine and consistency rules.
- `Questions`: question bank with status cycling and saved answers.
- `Applications`: job tracker with pipeline status counts.
- `Speaking`: recording log plus Groq-generated 4-question mock.
- `Progress`: streak, points, days engaged, question confidence, applications count.

## Useful Entry Points

- Client app: `client/src/App.jsx`
- API wrapper: `client/src/api.js`
- Backend app: `server/src/index.js`
- Daily flow: `server/src/routes/today.js`
- AI flow: `server/src/routes/ai.js`
- Planner: `server/src/planner.js`
- DB schema: `server/db/schema.sql`
- Raw context: `raw.context.md`

````

### brain\projects\interviewmentor\01-architecture.md

````markdown
# interviewMentor - Architecture

## Folder Layout

- `client/`: Vite React app.
- `client/src/api.js`: single fetch wrapper used by every page.
- `client/src/components/States.jsx`: shared loading, error, and inline notice UI.
- `client/src/pages/`: six route-level screens: Today, Roadmap, Questions, Applications, Speaking, Progress.
- `server/`: Express API.
- `server/src/index.js`: app setup, CORS, passcode guard, route mounting.
- `server/src/routes/today.js`: day seeding, task toggles, daily logs, day status.
- `server/src/routes/ai.js`: Groq-backed re-plan, learning feedback, mock interview generation.
- `server/src/routes/data.js`: generic CRUD for questions, applications, recordings plus roadmap/progress reads.
- `server/src/planner.js`: deterministic date-to-plan engine.
- `server/src/groq.js`: plain `fetch` wrapper for Groq chat completions.
- `server/src/notion.js`: optional one-way Notion sync.
- `server/db/schema.sql`: Supabase tables and seed questions.
- `server/src/data/roadmap.json`: 90-day phases and explicit days 1-14.
- `server/src/data/taskBank.json`: generated-day task pools.

## Request Flow

- Browser calls `api.*` from `client/src/api.js`.
- `api.js` prefixes `VITE_API_URL` and sends `x-app-passcode`.
- Express checks `APP_PASSCODE` unless the route is `/api/health`.
- Routes call Supabase using the service role client from `server/src/supabase.js`.
- AI routes call Groq from the backend only.
- Notion sync is best-effort and skipped when Notion env vars are absent.

## Daily Flow

```text
Today.jsx
  -> api.getToday()
  -> GET /api/today
  -> ensureDay(date)
  -> planForDate(date)
  -> Supabase days/tasks/logs
  -> Today.jsx renders day + tasks + progress chain
```

## Planning Model

- `PLAN_START_DATE` defaults to `2026-06-17`.
- Days before the start date return `beforeStart: true`.
- Days 1-14 are explicit rehabilitation days from `roadmap.json`.
- Days 15-90 are generated from current phase, weekday focus, and `taskBank.json`.
- Task picking is deterministic, so the same date produces the same plan.

## Data Model

- `days`: one row per calendar day.
- `tasks`: day tasks, usually code/learn/speak.
- `logs`: energy, mood, and reflection by date.
- `notes`: pasted learning notes plus AI feedback.
- `questions`: interview question bank.
- `applications`: job pipeline tracker.
- `recordings`: speaking-practice log.

````

### brain\projects\interviewmentor\02-packages.md

````markdown
# interviewMentor - Packages

## Client

- `react`: builds the UI screens and local component state.
- `react-dom`: mounts the React app.
- `react-router-dom`: tab routes for Today, Roadmap, Questions, Applications, Speaking, Progress.
- `vite`: dev server and production build tool.
- `@vitejs/plugin-react`: React support for Vite.

## Server

- `express`: HTTP API and route mounting.
- `cors`: allows the configured frontend origin to call the backend.
- `dotenv`: loads backend environment variables.
- `@supabase/supabase-js`: service-role Supabase client for all DB operations.

## External APIs Without SDKs

- Groq uses plain `fetch` against `https://api.groq.com/openai/v1/chat/completions`.
- Notion uses plain `fetch` against `https://api.notion.com/v1/...`.
- This keeps the server dependency list small and avoids SDK-specific abstractions.

## Runtime Requirements

- Node 18+.
- Supabase project with `server/db/schema.sql` applied.
- Backend `.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `APP_PASSCODE`.
- AI features also need `GROQ_API_KEY` and optionally `GROQ_MODEL`.
- Notion sync needs `NOTION_TOKEN` and database IDs.

````

### brain\projects\interviewmentor\03-implementations.md

````markdown
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

````

### brain\projects\interviewmentor\04-gotchas.md

````markdown
# interviewMentor - Decisions & Gotchas

## Decisions

- Single-user app by design.
- Backend uses Supabase service-role key; the browser never talks to Supabase directly.
- Passcode auth is intentionally light, not multi-user auth.
- Groq and Notion are plain `fetch` integrations, no SDKs.
- AI is an adapter around the roadmap, not the source of truth.
- Notion sync is optional and one-way.
- Missed days are not treated as debt; `rest` and low-energy modes keep the progress model humane.

## Gotchas

- If `APP_PASSCODE` is unset, the API is open except for local network/firewall boundaries. Set it before deployment.
- `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are required for real app usage; missing values only produce a warning at startup.
- `GROQ_API_KEY` is required only for AI features. Without it, normal day/task CRUD still works.
- Notion calls silently skip unless the relevant Notion env vars are set.
- `ensureDay()` seeds tasks only when the day row is created; changing `roadmap.json` later will not automatically update already-created days.
- `PLAN_START_DATE` controls the whole plan index. Moving it after data exists can make old rows inconsistent with the new calendar.
- `TIMEZONE` defaults to `Asia/Kolkata`; this matters because `todayDate()` is timezone-aware.
- AI re-plan replaces the day's tasks after sanitizing the model response. If the model returns no usable tasks, the original plan is kept.
- CRUD routes insert/update `req.body` directly, relying on the single-user trust model and DB schema.
- The schema has no user_id/RLS scoping yet. Adding a second user requires schema and auth changes, as noted in the README.

````

### brain\README.md

````markdown
# Code Brain - Index

> Personal knowledge base of shipped projects. This file is regenerated automatically.

| Project | Summary |
| --- | --- |
| [codebrain](./projects/codebrain/00-overview.md) | Personal code-memory tool that turns repos into structured markdown knowledge. |
| [interviewmentor](./projects/interviewmentor/00-overview.md) | Personal interview-prep coach named Mentor. |

## Folders
- `projects/` - one folder per project (00 overview to 04 gotchas + raw context)
- `patterns/` - cross-project reusable patterns
- `ideas/` - new ideas, dated YYYY-MM-DD

## Dashboard
- Open `brain/index.html` for the easier visual browser.

````

### package.json

````json
{
  "name": "code-brain",
  "version": "1.0.0",
  "description": "Personal RAG-style knowledge base built from your own shipped repos.",
  "private": true,
  "type": "commonjs",
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "bundle": "node scripts/brain-bundle.js",
    "import": "node scripts/brain-import.js",
    "refine": "node scripts/brain-refine.js",
    "all": "node scripts/brain-all.js",
    "idea": "node scripts/new-idea.js",
    "ui": "node scripts/brain-ui.js"
  }
}

````

### scripts\brain-all.js

````javascript
#!/usr/bin/env node
/**
 * brain-all.js
 * Run the whole pipeline over every repo inside a PARENT folder.
 * For each subfolder:  bundle  ->  refine  ->  (index rebuilds itself)
 *
 * Setup (Node 18+):  export GROQ_API_KEY=...   (skip with --bundle-only)
 *
 * Usage:
 *   node brain-all.js ./all-my-repos
 *   node brain-all.js ./all-my-repos --out ./brain --model openai/gpt-oss-120b
 *   node brain-all.js ./all-my-repos --bundle-only        # just make context files, no AI
 *   node brain-all.js ./all-my-repos --maxkb 200 --maxchars 200000
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadEnv } = require('./load-env');

loadEnv();

const HERE = __dirname;
const BUNDLE = path.join(HERE, 'brain-bundle.js');
const REFINE = path.join(HERE, 'brain-refine.js');
const UI = path.join(HERE, 'brain-ui.js');
const TOOL_ROOT = path.resolve(HERE, '..');

// ---------- args ----------
const USAGE = `Usage: node scripts/brain-all.js <parentFolderOfRepos> [--out ./brain] [--bundle-only] [--model name] [--maxkb N] [--maxchars N]

Options:
  --out dir       Brain output folder. Default: ./brain.
  --bundle-only   Build raw context files without the Groq refine step.
  --model name    Groq model to use for refinement.
  --maxkb N       Skip source files larger than N KB. Default: 250.
  --maxchars N    Limit context sent to the model. Default: 120000.
  -h, --help      Show this help.`;

const args = process.argv.slice(2);
let parentDir = null;
let brainDir = path.resolve('./brain');
let model = 'llama-3.3-70b-versatile';
let maxKb = 250;
let maxChars = 120000;
let bundleOnly = false;

function readOptionValue(flag, index) {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(`Missing value for ${flag}\n\n${USAGE}`);
    process.exit(1);
  }
  return value;
}

function readPositiveInt(flag, index, fallback) {
  const parsed = parseInt(readOptionValue(flag, index), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.error(`Invalid ${flag} value: ${args[index + 1]}\n\n${USAGE}`);
    process.exit(1);
  }
  return parsed || fallback;
}

if (args.includes('-h') || args.includes('--help')) {
  console.log(USAGE);
  process.exit(0);
}

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--out') brainDir = path.resolve(readOptionValue(a, i++));
  else if (a === '--model') model = readOptionValue(a, i++);
  else if (a === '--maxkb') maxKb = readPositiveInt(a, i++);
  else if (a === '--maxchars') maxChars = readPositiveInt(a, i++);
  else if (a === '--bundle-only') bundleOnly = true;
  else if (a.startsWith('--')) {
    console.error(`Unknown option: ${a}\n\n${USAGE}`);
    process.exit(1);
  } else if (!parentDir) parentDir = path.resolve(a);
  else {
    console.error(`Unexpected argument: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
}

if (!parentDir) {
  console.error(USAGE);
  process.exit(1);
}
if (!fs.existsSync(parentDir) || !fs.statSync(parentDir).isDirectory()) {
  console.error(`Parent folder not found: ${parentDir}`);
  process.exit(1);
}
if (!bundleOnly && !process.env.GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY. Set it, or pass --bundle-only to skip the AI step.');
  process.exit(1);
}

// ---------- find repos ----------
const SKIP = new Set(['brain', 'node_modules', '.git', 'code-brain', 'codebrain']);
const repos = fs.readdirSync(parentDir, { withFileTypes: true })
  .map(e => ({ entry: e, full: path.join(parentDir, e.name) }))
  .filter(({ entry, full }) => {
    if (!entry.isDirectory() || entry.name.startsWith('.')) return false;
    if (SKIP.has(entry.name.toLowerCase())) return false;
    const resolved = path.resolve(full);
    return resolved !== TOOL_ROOT && resolved !== path.resolve(brainDir);
  })
  .map(({ entry, full }) => ({ name: entry.name, full }));

if (!repos.length) {
  console.error(`No project folders found inside ${parentDir}`);
  process.exit(1);
}

const stagingDir = path.join(brainDir, '_staging');
fs.mkdirSync(stagingDir, { recursive: true });

console.log(`Found ${repos.length} repo(s) in ${parentDir}`);
console.log(bundleOnly ? 'Mode: bundle only\n' : `Mode: bundle + refine (${model})\n`);

const ok = [];
const failed = [];

for (const [idx, repo] of repos.entries()) {
  const tag = `[${idx + 1}/${repos.length}] ${repo.name}`;
  const contextPath = path.join(stagingDir, `${repo.name}.context.md`);
  try {
    console.log(`${tag}  -> bundling`);
    execFileSync('node', [BUNDLE, repo.full, '--out', contextPath, '--maxkb', String(maxKb)], { stdio: 'pipe' });

    if (!bundleOnly) {
      console.log(`${tag}  -> refining`);
      execFileSync('node', [REFINE, contextPath, '--out', brainDir, '--model', model, '--maxchars', String(maxChars)],
        { stdio: 'inherit' });
    }
    ok.push(repo.name);
  } catch (err) {
    console.error(`${tag}  -> FAILED: ${err.message.split('\n')[0]}`);
    failed.push(repo.name);
  }
}

console.log(`\nDone. Success: ${ok.length}, Failed: ${failed.length}`);
if (failed.length) console.log('Failed repos:', failed.join(', '));
console.log(`Brain: ${brainDir}`);
if (bundleOnly) console.log(`Context files staged in: ${stagingDir}`);
try {
  execFileSync('node', [UI, '--out', brainDir], { stdio: 'inherit' });
} catch (err) {
  console.warn(`Dashboard not rebuilt: ${err.message.split('\n')[0]}`);
}

````

### scripts\brain-bundle.js

````javascript
#!/usr/bin/env node
/**
 * brain-bundle.js
 * Turn any repo into ONE structured Markdown context file for your "code brain".
 *
 * Usage:
 *   node brain-bundle.js                      # bundles current folder
 *   node brain-bundle.js ./path/to/project    # bundles that folder
 *   node brain-bundle.js . --out brain.md     # custom output path
 *   node brain-bundle.js . --maxkb 150        # skip files bigger than 150 KB
 *
 * Works for .NET, Node, React, Next.js, Python, etc. No dependencies.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ---------- args ----------
const USAGE = `Usage: node scripts/brain-bundle.js [projectDir] [--out file] [--maxkb N] [--source-url url]

Options:
  --out file       Write the generated context markdown to this path.
  --maxkb N        Skip source files larger than N KB. Default: 250.
  --source-url url Store the repo/source URL in the generated context.
  -h, --help       Show this help.`;

const args = process.argv.slice(2);
let targetDir = process.cwd();
let outPath = null;
let maxKb = 250;
let sourceUrl = '';
let sawTarget = false;

function readOptionValue(flag, index) {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(`Missing value for ${flag}\n\n${USAGE}`);
    process.exit(1);
  }
  return value;
}

if (args.includes('-h') || args.includes('--help')) {
  console.log(USAGE);
  process.exit(0);
}

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--out') outPath = path.resolve(readOptionValue(a, i++));
  else if (a === '--source-url') sourceUrl = readOptionValue(a, i++);
  else if (a === '--maxkb') {
    const parsed = parseInt(readOptionValue(a, i++), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      console.error(`Invalid --maxkb value: ${args[i]}\n\n${USAGE}`);
      process.exit(1);
    }
    maxKb = parsed;
  } else if (a.startsWith('--')) {
    console.error(`Unknown option: ${a}\n\n${USAGE}`);
    process.exit(1);
  } else if (!sawTarget) {
    targetDir = path.resolve(a);
    sawTarget = true;
  } else {
    console.error(`Unexpected argument: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
}

const ROOT = path.resolve(targetDir);
if (!fs.existsSync(ROOT) || !fs.statSync(ROOT).isDirectory()) {
  console.error(`Project folder not found: ${ROOT}`);
  process.exit(1);
}

const projectName = path.basename(ROOT);
if (!outPath) outPath = path.join(ROOT, `${projectName}.context.md`);
const MAX_BYTES = maxKb * 1024;

function detectGitUrl() {
  if (sourceUrl) return sourceUrl;
  try {
    return execFileSync('git', ['-C', ROOT, 'config', '--get', 'remote.origin.url'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'TODO';
  }
}

// ---------- exclusions ----------
const EXCLUDED_DIRS = new Set([
  'node_modules', 'bin', 'obj', 'dist', 'build', 'out', '.next', '.nuxt',
  '.turbo', '.cache', '.git', '.vs', '.vscode', '.idea', '.svelte-kit',
  'vendor', '__pycache__', '.pytest_cache', 'target', 'Pods', 'DerivedData',
  'coverage', '_repos', '_staging'
]);

const EXCLUDED_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
  'host.json', 'appsettings.json', 'local.settings.json',
  '.DS_Store', 'Thumbs.db'
]);

const EXCLUDED_EXT = new Set([
  '.dll', '.pdb', '.exe', '.user', '.suo', '.bin', '.so', '.dylib',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif', '.bmp',
  '.mp4', '.webm', '.mov', '.mp3', '.wav',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z', '.map', '.log'
]);

const LANG = {
  '.js': 'javascript', '.jsx': 'jsx', '.ts': 'typescript', '.tsx': 'tsx',
  '.cs': 'csharp', '.json': 'json', '.html': 'html', '.css': 'css',
  '.scss': 'scss', '.sql': 'sql', '.py': 'python', '.sh': 'bash',
  '.md': 'markdown', '.yml': 'yaml', '.yaml': 'yaml', '.razor': 'razor',
  '.csproj': 'xml', '.config': 'xml', '.xml': 'xml'
};

function isExcludedFile(name) {
  if (EXCLUDED_FILES.has(name)) return true;
  if (name.startsWith('.env')) return true;
  if (name.startsWith('appsettings.')) return true;
  if (name.endsWith('.context.md')) return true;
  if (/\.min\.(js|css)$/.test(name)) return true;
  if (EXCLUDED_EXT.has(path.extname(name).toLowerCase())) return true;
  return false;
}

// ---------- walk ----------
const collected = [];     // { rel, full, size }
const skippedLarge = [];  // { rel, size }

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isSymbolicLink()) continue;
    const full = path.join(dir, e.name);

    if (e.isDirectory()) {
      if (EXCLUDED_DIRS.has(e.name)) continue;
      walk(full);
      continue;
    }
    if (!e.isFile()) continue;
    if (isExcludedFile(e.name)) continue;

    let size = 0;
    try {
      size = fs.statSync(full).size;
    } catch {
      continue;
    }
    const rel = path.relative(ROOT, full);
    if (size > MAX_BYTES) {
      skippedLarge.push({ rel, size });
      continue;
    }
    collected.push({ rel, full, size });
  }
}

// ---------- stack detection ----------
function detectStack() {
  const lines = [];

  const pkgFiles = collected.filter(f => path.basename(f.rel) === 'package.json');
  for (const pkgFile of pkgFiles) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgFile.full, 'utf8'));
      lines.push(`### npm - ${pkgFile.rel}`);
      if (pkg.name) lines.push(`**name** ${pkg.name}`);
      for (const key of ['dependencies', 'devDependencies']) {
        if (pkg[key] && Object.keys(pkg[key]).length) {
          lines.push(`**${key}**`);
          for (const [k, v] of Object.entries(pkg[key])) lines.push(`- ${k} ${v}`);
        }
      }
    } catch { /* ignore bad json */ }
  }

  for (const c of collected.filter(f => f.rel.endsWith('.csproj'))) {
    try {
      const txt = fs.readFileSync(c.full, 'utf8');
      const refs = [...txt.matchAll(/<PackageReference\s+Include="([^"]+)"(?:\s+Version="([^"]+)")?/g)];
      if (refs.length) {
        lines.push(`### NuGet - ${c.rel}`);
        for (const m of refs) lines.push(`- ${m[1]}${m[2] ? ' ' + m[2] : ''}`);
      }
    } catch { /* ignore */ }
  }

  return lines.length ? lines.join('\n') : '_No package.json or .csproj detected._';
}

// ---------- file tree ----------
function buildTree(paths) {
  const tree = {};
  for (const p of paths) {
    let node = tree;
    for (const part of p.split(path.sep)) {
      node[part] = node[part] || {};
      node = node[part];
    }
  }
  const out = [];
  (function render(node, prefix) {
    const keys = Object.keys(node).sort();
    keys.forEach((k, i) => {
      const last = i === keys.length - 1;
      out.push(prefix + (last ? '`-- ' : '|-- ') + k);
      render(node[k], prefix + (last ? '    ' : '|   '));
    });
  })(tree, '');
  return out.join('\n');
}

function extStats() {
  const counts = {};
  for (const f of collected) {
    const ext = path.extname(f.rel).toLowerCase() || '(none)';
    counts[ext] = (counts[ext] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([e, c]) => `- ${e}: ${c}`)
    .join('\n');
}

// ---------- run ----------
walk(ROOT);
collected.sort((a, b) => a.rel.localeCompare(b.rel));

fs.mkdirSync(path.dirname(outPath), { recursive: true });
const stream = fs.createWriteStream(outPath, { flags: 'w' });
const FENCE = '````'; // 4 backticks so source files containing ``` don't break it

stream.write(`# Project Context: ${projectName}\n\n`);
stream.write(`- Generated: ${new Date().toISOString()}\n`);
stream.write(`- Source path: ${ROOT}\n`);
stream.write(`- Git URL: ${detectGitUrl()}\n`);
stream.write(`- Files included: ${collected.length}\n`);
stream.write(`- Files skipped (> ${maxKb} KB): ${skippedLarge.length}\n\n`);

stream.write(`## Detected stack & packages\n\n${detectStack()}\n\n`);
stream.write(`## File type breakdown\n\n${extStats()}\n\n`);
stream.write(`## File tree\n\n\`\`\`\n${buildTree(collected.map(f => f.rel))}\n\`\`\`\n\n`);

if (skippedLarge.length) {
  stream.write(`## Skipped large files\n\n`);
  for (const s of skippedLarge) stream.write(`- ${s.rel} (${Math.round(s.size / 1024)} KB)\n`);
  stream.write('\n');
}

stream.write(`## Source files\n`);
for (const f of collected) {
  const lang = LANG[path.extname(f.rel).toLowerCase()] || '';
  stream.write(`\n### ${f.rel}\n\n`);
  stream.write(`${FENCE}${lang}\n`);
  try {
    stream.write(fs.readFileSync(f.full, 'utf8'));
  } catch (err) {
    stream.write(`[ERROR READING FILE: ${err.message}]`);
  }
  stream.write(`\n${FENCE}\n`);
}

stream.end();
stream.on('error', err => {
  console.error(`Failed to write ${outPath}: ${err.message}`);
  process.exit(1);
});
stream.on('finish', () => {
  console.log(`Done. ${collected.length} files -> ${outPath}`);
  if (skippedLarge.length) console.log(`Skipped ${skippedLarge.length} large file(s).`);
});

````

### scripts\brain-import.js

````javascript
#!/usr/bin/env node
/**
 * Import one GitHub repository into the code brain.
 *
 * Usage:
 *   node scripts/brain-import.js https://github.com/owner/repo
 *   node scripts/brain-import.js https://github.com/owner/repo --bundle-only
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadEnv } = require('./load-env');

loadEnv();

const HERE = __dirname;
const BUNDLE = path.join(HERE, 'brain-bundle.js');
const REFINE = path.join(HERE, 'brain-refine.js');
const UI = path.join(HERE, 'brain-ui.js');

const USAGE = `Usage: node scripts/brain-import.js <github-url-or-local-folder> [--out ./brain] [--bundle-only] [--model name] [--maxkb N] [--maxchars N] [--fresh]

Options:
  --out dir       Brain output folder. Default: ./brain.
  --bundle-only   Build raw context without the Groq refine step.
  --model name    Groq model to use for refinement.
  --maxkb N       Skip source files larger than N KB. Default: 250.
  --maxchars N    Limit context sent to the model. Default: 120000.
  --fresh         Delete the cached clone before importing.
  -h, --help      Show this help.`;

const args = process.argv.slice(2);
let source = null;
let brainDir = path.resolve('./brain');
let model = 'llama-3.3-70b-versatile';
let maxKb = 250;
let maxChars = 120000;
let bundleOnly = false;
let fresh = false;

function readOptionValue(flag, index) {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(`Missing value for ${flag}\n\n${USAGE}`);
    process.exit(1);
  }
  return value;
}

function readPositiveInt(flag, index) {
  const parsed = parseInt(readOptionValue(flag, index), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.error(`Invalid ${flag} value: ${args[index + 1]}\n\n${USAGE}`);
    process.exit(1);
  }
  return parsed;
}

if (args.includes('-h') || args.includes('--help')) {
  console.log(USAGE);
  process.exit(0);
}

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--out') brainDir = path.resolve(readOptionValue(a, i++));
  else if (a === '--model') model = readOptionValue(a, i++);
  else if (a === '--maxkb') maxKb = readPositiveInt(a, i++);
  else if (a === '--maxchars') maxChars = readPositiveInt(a, i++);
  else if (a === '--bundle-only') bundleOnly = true;
  else if (a === '--fresh') fresh = true;
  else if (a.startsWith('--')) {
    console.error(`Unknown option: ${a}\n\n${USAGE}`);
    process.exit(1);
  } else if (!source) source = a;
  else {
    console.error(`Unexpected argument: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
}

if (!source) {
  console.error(USAGE);
  process.exit(1);
}
if (!bundleOnly && !process.env.GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY. Set it, or pass --bundle-only to create raw context only.');
  process.exit(1);
}

function isGithubUrl(value) {
  return /^https?:\/\/github\.com\/[^/]+\/[^/\s#?]+/i.test(value) || /^git@github\.com:[^/]+\/[^/\s#?]+/i.test(value);
}

function slugFromSource(value) {
  if (!isGithubUrl(value)) {
    return path.basename(path.resolve(value)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  }

  const cleaned = value
    .replace(/\.git$/i, '')
    .replace(/[?#].*$/, '')
    .replace(/^git@github\.com:/i, '')
    .replace(/^https?:\/\/github\.com\//i, '');
  const parts = cleaned.split(/[\\/]/).filter(Boolean);
  const repo = parts[parts.length - 1] || path.basename(path.resolve(value));
  return repo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
}

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', ...options });
}

fs.mkdirSync(brainDir, { recursive: true });
const stagingDir = path.join(brainDir, '_staging');
const repoCacheDir = path.join(brainDir, '_repos');
fs.mkdirSync(stagingDir, { recursive: true });
fs.mkdirSync(repoCacheDir, { recursive: true });

const slug = slugFromSource(source);
let repoDir = path.resolve(source);

if (isGithubUrl(source)) {
  repoDir = path.join(repoCacheDir, slug);
  if (fresh && fs.existsSync(repoDir)) {
    fs.rmSync(repoDir, { recursive: true, force: true });
  }
  if (fs.existsSync(path.join(repoDir, '.git'))) {
    console.log(`Updating cached repo: ${repoDir}`);
    run('git', ['-C', repoDir, 'pull', '--ff-only']);
  } else {
    if (fs.existsSync(repoDir)) fs.rmSync(repoDir, { recursive: true, force: true });
    console.log(`Cloning ${source} -> ${repoDir}`);
    run('git', ['clone', '--depth', '1', source, repoDir]);
  }
} else if (!fs.existsSync(repoDir) || !fs.statSync(repoDir).isDirectory()) {
  console.error(`Source is not a GitHub URL or local folder: ${source}`);
  process.exit(1);
}

const contextPath = path.join(stagingDir, `${slug}.context.md`);
console.log(`Bundling ${repoDir}`);
const bundleArgs = [BUNDLE, repoDir, '--out', contextPath, '--maxkb', String(maxKb)];
if (isGithubUrl(source)) bundleArgs.push('--source-url', source);
run('node', bundleArgs);

if (bundleOnly) {
  const projectDir = path.join(brainDir, 'projects', slug);
  fs.mkdirSync(projectDir, { recursive: true });
  fs.copyFileSync(contextPath, path.join(projectDir, 'raw.context.md'));
  const overviewPath = path.join(projectDir, '00-overview.md');
  if (!fs.existsSync(overviewPath)) {
    fs.writeFileSync(overviewPath, `# ${slug} - Overview

- Bundle-only import from ${source}.
- Run \`npm run import -- ${source}\` with \`GROQ_API_KEY\` set to generate architecture, package, implementation, and gotcha notes.
- Git URL: ${isGithubUrl(source) ? source : 'TODO'}

## Available Detail

- Open \`raw.context.md\` for the bundled source context.
`);
  }
  console.log(`Bundle-only mode. Raw context copied to: ${path.join(projectDir, 'raw.context.md')}`);
} else {
  console.log(`Refining ${slug} with ${model}`);
  run('node', [REFINE, contextPath, '--out', brainDir, '--model', model, '--maxchars', String(maxChars)]);
}

run('node', [UI, '--out', brainDir]);
console.log(`Done. Open ${path.join(brainDir, 'index.html')}`);

````

### scripts\brain-refine.js

````javascript
#!/usr/bin/env node
/**
 * brain-refine.js
 * Phase 2 (AI pass): turn a raw *.context.md into structured brain entries.
 *
 * Flow:  context.md  ->  Groq  ->  brain/projects/<name>/00..04.md  ->  rebuild README index
 *
 * Setup (Node 18+, no dependencies — uses built-in fetch):
 *   export GROQ_API_KEY=your_key        # Windows PowerShell: $env:GROQ_API_KEY="your_key"
 *
 * Usage:
 *   node brain-refine.js ./apnanest.context.md
 *   node brain-refine.js ./x.context.md --out ./brain --model openai/gpt-oss-120b
 *   node brain-refine.js ./x.context.md --maxchars 200000
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadEnv } = require('./load-env');

loadEnv();

// ---------- args ----------
const USAGE = `Usage: node scripts/brain-refine.js <context.md> [--out ./brain] [--model name] [--maxchars N]

Options:
  --out dir       Brain output folder. Default: ./brain.
  --model name    Groq model to use. Default: llama-3.3-70b-versatile.
  --maxchars N    Limit context sent to the model. Default: 120000.
  -h, --help      Show this help.`;

const args = process.argv.slice(2);
let inputPath = null;
let brainDir = path.resolve('./brain');
let model = 'llama-3.3-70b-versatile'; // swap to openai/gpt-oss-120b for deeper code reasoning
let maxChars = 120000;                 // ~30k tokens; raise if your model's context allows

function readOptionValue(flag, index) {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(`Missing value for ${flag}\n\n${USAGE}`);
    process.exit(1);
  }
  return value;
}

if (args.includes('-h') || args.includes('--help')) {
  console.log(USAGE);
  process.exit(0);
}

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--out') brainDir = path.resolve(readOptionValue(a, i++));
  else if (a === '--model') model = readOptionValue(a, i++);
  else if (a === '--maxchars') {
    const parsed = parseInt(readOptionValue(a, i++), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      console.error(`Invalid --maxchars value: ${args[i]}\n\n${USAGE}`);
      process.exit(1);
    }
    maxChars = parsed;
  } else if (a.startsWith('--')) {
    console.error(`Unknown option: ${a}\n\n${USAGE}`);
    process.exit(1);
  } else if (!inputPath) inputPath = path.resolve(a);
  else {
    console.error(`Unexpected argument: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
}

if (!inputPath) {
  console.error(USAGE);
  process.exit(1);
}
if (!fs.existsSync(inputPath) || !fs.statSync(inputPath).isFile()) {
  console.error(`Context file not found: ${inputPath}`);
  process.exit(1);
}
if (!process.env.GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY environment variable.');
  process.exit(1);
}

// ---------- read + identify ----------
let context = fs.readFileSync(inputPath, 'utf8');

let projectName = path.basename(inputPath).replace(/\.context\.md$/i, '').replace(/\.md$/i, '');
const headerMatch = context.match(/^#\s*Project Context:\s*(.+)$/m);
if (headerMatch) projectName = headerMatch[1].trim();
const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

let truncated = false;
if (context.length > maxChars) {
  context = context.slice(0, maxChars);
  truncated = true;
}

const SECTIONS = ['00-overview', '01-architecture', '02-packages', '03-implementations', '04-gotchas'];

const prompt = `You are building a "code brain" entry for a developer's personal knowledge base.
Below is the full context of ONE project (stack, file tree, source files).

Produce FIVE markdown documents. Rules:
- Base everything STRICTLY on the provided context. Never invent packages, files, or behavior.
- Be concise and scannable: short bullets, short lines, grouped. No long paragraphs.
- For implementations, paste REAL code snippets copied from the source, trimmed to the relevant part.
- If something is genuinely unknown (e.g. git URL), write "TODO".
- Do not copy the guidance bullets below. Replace them with project-specific facts from the context.

Output EXACTLY in this delimiter format. Nothing before, after, or between except the documents:

===FILE:00-overview===
# ${projectName} - Overview
- Describe what this project actually does.
- Summarize the stack from detected files and package metadata.
- Describe current status/scope from the context.
- Include the Git URL if it appears in the context.

===FILE:01-architecture===
# ${projectName} - Architecture
- Explain the real folder layout and what each part does.
- Explain layers and responsibilities.
- Explain request/data flow if present; otherwise say what is not present.

===FILE:02-packages===
# ${projectName} - Packages
- List each significant dependency and why it is used here.
- If there are no runtime dependencies, say that clearly.

===FILE:03-implementations===
# ${projectName} - Key Implementations
- Explain the important working pieces and notable patterns.
- Include real fenced code snippets copied from the source.

===FILE:04-gotchas===
# ${projectName} - Decisions & Gotchas
- Explain non-obvious decisions and why they matter.
- Explain things to remember and potential pitfalls.

PROJECT CONTEXT:
${context}`;

// ---------- run ----------
async function main() {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error(`Groq error ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';

  // split delimiter sections (robust for code-heavy content; avoids JSON escaping issues)
  const parts = {};
  const regex = /===FILE:([0-9a-z-]+)===\s*([\s\S]*?)(?====FILE:|$)/g;
  let m;
  while ((m = regex.exec(text)) !== null) parts[m[1].trim()] = m[2].trim();

  const projDir = path.join(brainDir, 'projects', slug);
  fs.mkdirSync(projDir, { recursive: true });

  let written = 0;
  for (const key of SECTIONS) {
    if (parts[key]) {
      fs.writeFileSync(path.join(projDir, `${key}.md`), parts[key] + '\n');
      written++;
    } else {
      console.warn(`  ! missing section: ${key}`);
    }
  }

  fs.copyFileSync(inputPath, path.join(projDir, 'raw.context.md')); // fallback detail
  rebuildIndex(brainDir);
  rebuildDashboard(brainDir);

  console.log(`Refined "${projectName}" -> ${projDir}`);
  console.log(`Sections: ${written}/5${truncated ? '  (context was truncated — consider --maxchars or split)' : ''}`);
}

function rebuildDashboard(dir) {
  const uiScript = path.join(__dirname, 'brain-ui.js');
  if (!fs.existsSync(uiScript)) return;
  try {
    execFileSync('node', [uiScript, '--out', dir], { stdio: 'inherit' });
  } catch (err) {
    console.warn(`  ! dashboard not rebuilt: ${err.message.split('\n')[0]}`);
  }
}

// ---------- index ----------
function rebuildIndex(dir) {
  const projectsDir = path.join(dir, 'projects');
  if (!fs.existsSync(projectsDir)) return;

  const rows = [];
  for (const name of fs.readdirSync(projectsDir).sort()) {
    const overview = path.join(projectsDir, name, '00-overview.md');
    let summary = '';
    if (fs.existsSync(overview)) {
      const lines = fs.readFileSync(overview, 'utf8').split('\n').map(l => l.trim());
      const bullet = lines.find(l => l.startsWith('- '));
      summary = bullet ? bullet.replace(/^-\s*/, '').slice(0, 120) : '';
    }
    rows.push(`| [${name}](./projects/${name}/00-overview.md) | ${summary} |`);
  }

  const out = `# Code Brain — Index

> Personal knowledge base of shipped projects. This file is regenerated automatically.

| Project | Summary |
| --- | --- |
${rows.join('\n')}

## Folders
- \`projects/\` — one folder per project (00 overview … 04 gotchas + raw context)
- \`patterns/\` — cross-project reusable patterns (write by hand as you spot them)
- \`ideas/\` — new ideas, dated YYYY-MM-DD
`;
  fs.writeFileSync(path.join(dir, 'README.md'), out);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

````

### scripts\brain-ui.js

````javascript
#!/usr/bin/env node
/**
 * Generate a dependency-free dashboard for browsing the local code brain.
 *
 * Usage:
 *   node scripts/brain-ui.js
 *   node scripts/brain-ui.js --out ./brain
 */

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node scripts/brain-ui.js [--out ./brain]

Options:
  --out dir     Brain folder. Default: ./brain.
  -h, --help    Show this help.`;

const args = process.argv.slice(2);
let brainDir = path.resolve('./brain');

function readOptionValue(flag, index) {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(`Missing value for ${flag}\n\n${USAGE}`);
    process.exit(1);
  }
  return value;
}

if (args.includes('-h') || args.includes('--help')) {
  console.log(USAGE);
  process.exit(0);
}

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--out') brainDir = path.resolve(readOptionValue(a, i++));
  else {
    console.error(`Unknown option: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
}

const SECTION_FILES = [
  ['00-overview', 'Overview'],
  ['01-architecture', 'Architecture'],
  ['02-packages', 'Packages'],
  ['03-implementations', 'Implementations'],
  ['04-gotchas', 'Gotchas'],
  ['raw.context', 'Raw Context'],
];

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function extractTitle(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function extractSummary(markdown) {
  const lines = markdown.split(/\r?\n/).map(line => line.trim());
  const bullet = lines.find(line => line.startsWith('- ') && line.length > 2);
  if (bullet) return bullet.replace(/^-\s*/, '').slice(0, 180);
  const text = lines.find(line => line && !line.startsWith('#'));
  return text ? text.slice(0, 180) : 'No summary yet.';
}

function loadProjects() {
  const projectsDir = path.join(brainDir, 'projects');
  if (!fs.existsSync(projectsDir)) return [];

  return fs.readdirSync(projectsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const projectDir = path.join(projectsDir, entry.name);
      const sections = {};
      for (const [fileKey, label] of SECTION_FILES) {
        const filename = fileKey === 'raw.context' ? 'raw.context.md' : `${fileKey}.md`;
        const content = readIfExists(path.join(projectDir, filename));
        if (content) sections[fileKey] = { label, content };
      }
      const overview = sections['00-overview']?.content || '';
      return {
        slug: entry.name,
        title: extractTitle(overview, entry.name).replace(/\s+-\s+Overview$/i, ''),
        summary: extractSummary(overview),
        sections,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function rebuildMarkdownIndex(projects) {
  fs.mkdirSync(brainDir, { recursive: true });
  const rows = projects.map(project =>
    `| [${project.slug}](./projects/${project.slug}/00-overview.md) | ${project.summary.replace(/\|/g, '\\|')} |`
  );
  const out = `# Code Brain - Index

> Personal knowledge base of shipped projects. This file is regenerated automatically.

| Project | Summary |
| --- | --- |
${rows.join('\n')}

## Folders
- \`projects/\` - one folder per project (00 overview to 04 gotchas + raw context)
- \`patterns/\` - cross-project reusable patterns
- \`ideas/\` - new ideas, dated YYYY-MM-DD

## Dashboard
- Open \`brain/index.html\` for the easier visual browser.
`;
  fs.writeFileSync(path.join(brainDir, 'README.md'), out);
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function html(projects) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Code Brain</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f7f3;
      --ink: #191a16;
      --muted: #6b6f64;
      --line: #deded4;
      --panel: #ffffff;
      --panel-2: #efefe6;
      --accent: #2f6f5e;
      --accent-2: #d8ebe4;
      --code: #171914;
      --code-ink: #edf2e9;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background:
        radial-gradient(circle at 18% 12%, rgba(47, 111, 94, .12), transparent 28rem),
        linear-gradient(180deg, #fbfbf7, var(--bg));
    }
    button, input { font: inherit; }
    .app {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
    }
    aside {
      position: sticky;
      top: 0;
      height: 100vh;
      padding: 24px;
      border-right: 1px solid var(--line);
      background: rgba(255,255,255,.72);
      backdrop-filter: blur(14px);
      overflow: auto;
    }
    main {
      min-width: 0;
      padding: 28px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .mark {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background:
        linear-gradient(90deg, transparent 47%, rgba(255,255,255,.52) 48% 52%, transparent 53%),
        radial-gradient(circle at 30% 28%, #9cd3bd 0 15%, transparent 16%),
        radial-gradient(circle at 68% 34%, #7ab7a3 0 15%, transparent 16%),
        radial-gradient(circle at 48% 70%, #2f6f5e 0 18%, transparent 19%),
        #d8ebe4;
      border: 1px solid #b7d7cb;
      box-shadow: inset 0 0 0 5px rgba(255,255,255,.38);
    }
    h1 { margin: 0; font-size: 22px; letter-spacing: 0; }
    .sub { margin: 3px 0 0; color: var(--muted); font-size: 13px; }
    .search {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 11px 12px;
      background: var(--panel);
      color: var(--ink);
      outline: none;
    }
    .search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-2); }
    .project-list {
      display: grid;
      gap: 10px;
      margin-top: 18px;
    }
    .project-btn {
      text-align: left;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      background: var(--panel);
      cursor: pointer;
    }
    .project-btn:hover, .project-btn.active {
      border-color: #9fc8ba;
      background: var(--accent-2);
    }
    .project-name { display: block; font-weight: 750; margin-bottom: 4px; }
    .project-summary { color: var(--muted); font-size: 13px; line-height: 1.4; }
    .topbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      max-width: 1120px;
      margin: 0 auto 18px;
    }
    .title h2 { margin: 0 0 6px; font-size: 30px; letter-spacing: 0; }
    .title p { margin: 0; color: var(--muted); line-height: 1.5; }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }
    .action, .tab {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      padding: 9px 11px;
      cursor: pointer;
      color: var(--ink);
      text-decoration: none;
    }
    .action:hover, .tab:hover { border-color: #9fc8ba; }
    .tabs {
      max-width: 1120px;
      margin: 0 auto 14px;
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 3px;
    }
    .tab.active {
      background: var(--accent);
      border-color: var(--accent);
      color: white;
    }
    .content {
      max-width: 1120px;
      margin: 0 auto;
      background: rgba(255,255,255,.82);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 26px;
      overflow: hidden;
    }
    .empty {
      color: var(--muted);
      padding: 28px;
      text-align: center;
      border: 1px dashed var(--line);
      border-radius: 8px;
      background: rgba(255,255,255,.6);
    }
    .md { line-height: 1.62; overflow-wrap: anywhere; }
    .md h1, .md h2, .md h3 { line-height: 1.22; letter-spacing: 0; }
    .md h1 { font-size: 28px; margin: 0 0 18px; }
    .md h2 { font-size: 21px; margin: 28px 0 10px; }
    .md h3 { font-size: 17px; margin: 22px 0 8px; }
    .md p { margin: 9px 0; }
    .md ul { padding-left: 22px; }
    .md li { margin: 6px 0; }
    .md code {
      border-radius: 5px;
      background: var(--panel-2);
      padding: 2px 5px;
      font-size: .92em;
    }
    .md pre {
      margin: 14px 0;
      padding: 16px;
      border-radius: 8px;
      overflow: auto;
      background: var(--code);
      color: var(--code-ink);
    }
    .md pre code {
      padding: 0;
      background: transparent;
      color: inherit;
    }
    .md table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
      display: block;
      overflow-x: auto;
    }
    .md th, .md td { border: 1px solid var(--line); padding: 8px 10px; text-align: left; }
    .md blockquote {
      margin: 14px 0;
      padding: 8px 14px;
      border-left: 4px solid var(--accent);
      color: var(--muted);
      background: var(--accent-2);
    }
    @media (max-width: 820px) {
      .app { display: block; }
      aside { position: relative; height: auto; }
      main { padding: 20px; }
      .topbar { display: block; }
      .actions { justify-content: flex-start; margin-top: 14px; }
      .content { padding: 18px; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside>
      <div class="brand">
        <div class="mark" aria-hidden="true"></div>
        <div>
          <h1>Code Brain</h1>
          <p class="sub">Projects, patterns, and reusable implementation memory.</p>
        </div>
      </div>
      <input id="search" class="search" type="search" placeholder="Search projects or markdown">
      <div id="projectList" class="project-list"></div>
    </aside>
    <main>
      <section class="topbar">
        <div class="title">
          <h2 id="projectTitle">No projects yet</h2>
          <p id="projectSummary">Import a repository to generate markdown knowledge files.</p>
        </div>
        <div class="actions">
          <button class="action" id="copyImport">Copy import command</button>
          <button class="action" id="copyUpload">Copy Claude upload checklist</button>
        </div>
      </section>
      <nav id="tabs" class="tabs"></nav>
      <article id="content" class="content empty">Run <code>npm run import -- &lt;github-url&gt;</code> or <code>npm run all -- &lt;repos-folder&gt;</code>.</article>
    </main>
  </div>
  <script>
    const PROJECTS = ${safeJson(projects)};
    let selectedProject = PROJECTS[0]?.slug || '';
    let selectedSection = '00-overview';

    const el = {
      list: document.getElementById('projectList'),
      search: document.getElementById('search'),
      title: document.getElementById('projectTitle'),
      summary: document.getElementById('projectSummary'),
      tabs: document.getElementById('tabs'),
      content: document.getElementById('content'),
      copyImport: document.getElementById('copyImport'),
      copyUpload: document.getElementById('copyUpload'),
    };

    function escapeHtml(text) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function inline(text) {
      return escapeHtml(text)
        .replace(new RegExp('\\\\x60([^\\\\x60]+)\\\\x60', 'g'), '<code>$1</code>')
        .replace(new RegExp('\\\\*\\\\*([^*]+)\\\\*\\\\*', 'g'), '<strong>$1</strong>')
        .replace(new RegExp('\\\\[([^\\\\]]+)\\\\]\\\\(([^)]+)\\\\)', 'g'), '<a href="$2">$1</a>');
    }

    function renderMarkdown(md) {
      const lines = md.split(/\\r?\\n/);
      const out = [];
      let inCode = false;
      let listOpen = false;
      let table = [];

      function closeList() {
        if (listOpen) out.push('</ul>');
        listOpen = false;
      }

      function flushTable() {
        if (!table.length) return;
        out.push('<table>');
        table.forEach((row, index) => {
          if (/^\\s*\\|?\\s*:?-{3,}/.test(row)) return;
          const cells = row.trim().replace(/^\\||\\|$/g, '').split('|').map(cell => inline(cell.trim()));
          out.push('<tr>' + cells.map(cell => index === 0 ? '<th>' + cell + '</th>' : '<td>' + cell + '</td>').join('') + '</tr>');
        });
        out.push('</table>');
        table = [];
      }

      for (const line of lines) {
        const fence = line.match(new RegExp('^\\\\x60{3,4}\\\\w*'));
        if (fence) {
          flushTable();
          closeList();
          if (!inCode) out.push('<pre><code>');
          else out.push('</code></pre>');
          inCode = !inCode;
          continue;
        }
        if (inCode) {
          out.push(escapeHtml(line) + '\\n');
          continue;
        }
        if (/^\\|.+\\|$/.test(line.trim())) {
          closeList();
          table.push(line);
          continue;
        }
        flushTable();
        if (!line.trim()) {
          closeList();
          continue;
        }
        if (line.startsWith('### ')) { closeList(); out.push('<h3>' + inline(line.slice(4)) + '</h3>'); continue; }
        if (line.startsWith('## ')) { closeList(); out.push('<h2>' + inline(line.slice(3)) + '</h2>'); continue; }
        if (line.startsWith('# ')) { closeList(); out.push('<h1>' + inline(line.slice(2)) + '</h1>'); continue; }
        if (line.startsWith('> ')) { closeList(); out.push('<blockquote>' + inline(line.slice(2)) + '</blockquote>'); continue; }
        if (/^[-*]\\s+/.test(line)) {
          if (!listOpen) out.push('<ul>');
          listOpen = true;
          out.push('<li>' + inline(line.replace(/^[-*]\\s+/, '')) + '</li>');
          continue;
        }
        closeList();
        out.push('<p>' + inline(line) + '</p>');
      }
      flushTable();
      closeList();
      if (inCode) out.push('</code></pre>');
      return '<div class="md">' + out.join('\\n') + '</div>';
    }

    function currentProject() {
      return PROJECTS.find(project => project.slug === selectedProject) || PROJECTS[0];
    }

    function matches(project, query) {
      if (!query) return true;
      const haystack = [
        project.title,
        project.summary,
        ...Object.values(project.sections).map(section => section.content)
      ].join('\\n').toLowerCase();
      return haystack.includes(query.toLowerCase());
    }

    function renderList() {
      const query = el.search.value.trim();
      const visible = PROJECTS.filter(project => matches(project, query));
      el.list.innerHTML = visible.map(project => \`
        <button class="project-btn \${project.slug === selectedProject ? 'active' : ''}" data-project="\${escapeHtml(project.slug)}">
          <span class="project-name">\${escapeHtml(project.title)}</span>
          <span class="project-summary">\${escapeHtml(project.summary)}</span>
        </button>
      \`).join('') || '<div class="empty">No matches.</div>';
    }

    function renderProject() {
      const project = currentProject();
      if (!project) return;
      if (!project.sections[selectedSection]) selectedSection = Object.keys(project.sections)[0] || '00-overview';
      el.title.textContent = project.title;
      el.summary.textContent = project.summary;
      el.tabs.innerHTML = Object.entries(project.sections).map(([key, section]) => \`
        <button class="tab \${key === selectedSection ? 'active' : ''}" data-section="\${escapeHtml(key)}">\${escapeHtml(section.label)}</button>
      \`).join('');
      const section = project.sections[selectedSection];
      el.content.className = 'content';
      el.content.innerHTML = section ? renderMarkdown(section.content) : '<div class="empty">No content for this section yet.</div>';
      renderList();
    }

    el.list.addEventListener('click', event => {
      const button = event.target.closest('[data-project]');
      if (!button) return;
      selectedProject = button.dataset.project;
      selectedSection = '00-overview';
      renderProject();
    });

    el.tabs.addEventListener('click', event => {
      const button = event.target.closest('[data-section]');
      if (!button) return;
      selectedSection = button.dataset.section;
      renderProject();
    });

    el.search.addEventListener('input', renderList);

    el.copyImport.addEventListener('click', async () => {
      await navigator.clipboard.writeText('npm run import -- https://github.com/owner/repo');
      el.copyImport.textContent = 'Copied';
      setTimeout(() => el.copyImport.textContent = 'Copy import command', 1200);
    });

    el.copyUpload.addEventListener('click', async () => {
      const project = currentProject();
      const text = project
        ? \`Upload these markdown files for \${project.slug}:\\nbrain/projects/\${project.slug}/00-overview.md\\nbrain/projects/\${project.slug}/01-architecture.md\\nbrain/projects/\${project.slug}/02-packages.md\\nbrain/projects/\${project.slug}/03-implementations.md\\nbrain/projects/\${project.slug}/04-gotchas.md\`
        : 'Upload 00-overview.md through 04-gotchas.md from each brain/projects/* folder.';
      await navigator.clipboard.writeText(text);
      el.copyUpload.textContent = 'Copied';
      setTimeout(() => el.copyUpload.textContent = 'Copy Claude upload checklist', 1200);
    });

    renderProject();
  </script>
</body>
</html>`;
}

const projects = loadProjects();
rebuildMarkdownIndex(projects);
const outPath = path.join(brainDir, 'index.html');
fs.writeFileSync(outPath, html(projects));
console.log(`Dashboard generated -> ${outPath}`);
console.log(`Projects: ${projects.length}`);

````

### scripts\load-env.js

````javascript
const fs = require('fs');
const path = require('path');

function loadEnv(file = path.resolve('.env')) {
  if (!fs.existsSync(file)) return;

  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (!key || process.env[key]) continue;

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

module.exports = { loadEnv };

````

### scripts\new-idea.js

````javascript
#!/usr/bin/env node
/**
 * new-idea.js
 * Generate a structured idea document for the brain (the "grows over time" part).
 * Pulls the brain index for context so ideas connect to what you already built.
 *
 * Setup (Node 18+):  export GROQ_API_KEY=...
 *
 * Usage:
 *   node new-idea.js "AI resume tailor"
 *   node new-idea.js "AI resume tailor" --desc "tailors my resume per job description"
 *   node new-idea.js "X" --out ./brain --model openai/gpt-oss-120b
 */

const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./load-env');

loadEnv();

// ---------- args ----------
const USAGE = `Usage: node scripts/new-idea.js "<idea title>" [--desc "..."] [--out ./brain] [--model name]

Options:
  --desc text    Short description to guide the idea plan.
  --out dir      Brain folder. Default: ./brain.
  --model name   Groq model to use. Default: llama-3.3-70b-versatile.
  -h, --help     Show this help.`;

const args = process.argv.slice(2);
let title = null;
let desc = '';
let brainDir = path.resolve('./brain');
let model = 'llama-3.3-70b-versatile';

function readOptionValue(flag, index) {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(`Missing value for ${flag}\n\n${USAGE}`);
    process.exit(1);
  }
  return value;
}

if (args.includes('-h') || args.includes('--help')) {
  console.log(USAGE);
  process.exit(0);
}

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--desc') desc = readOptionValue(a, i++);
  else if (a === '--out') brainDir = path.resolve(readOptionValue(a, i++));
  else if (a === '--model') model = readOptionValue(a, i++);
  else if (a.startsWith('--')) {
    console.error(`Unknown option: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
  else if (!a.startsWith('--') && !title) title = a;
  else {
    console.error(`Unexpected argument: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
}

if (!title) {
  console.error(USAGE);
  process.exit(1);
}
if (!process.env.GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY environment variable.');
  process.exit(1);
}

// ---------- context from existing brain ----------
let indexContext = '';
const readme = path.join(brainDir, 'README.md');
if (fs.existsSync(readme)) indexContext = fs.readFileSync(readme, 'utf8').slice(0, 4000);

const date = new Date().toISOString().slice(0, 10);
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const prompt = `You are a pragmatic senior engineer helping plan a new project idea.

Existing projects in this developer's brain (for reuse and context):
${indexContext || '(none yet)'}

New idea title: ${title}
${desc ? `Short description: ${desc}` : ''}

Write ONE concise, scannable markdown plan. Short bullets, short lines, grouped. No long paragraphs.
Where useful, point to which existing project's patterns could be reused.
Use these sections exactly:

# ${title}

## Problem / why
## Core idea
## Suggested stack
## Build phases
## Reuse from existing projects
## Risks / open questions
## First concrete step`;

async function main() {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error(`Groq error ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  const text = (data.choices?.[0]?.message?.content || '').trim();

  const ideasDir = path.join(brainDir, 'ideas');
  fs.mkdirSync(ideasDir, { recursive: true });
  const outPath = path.join(ideasDir, `${date}-${slug}.md`);
  fs.writeFileSync(outPath, text + '\n');
  console.log(`Idea saved -> ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

````

### SETUP.md

````markdown
# Code Brain - Setup & Usage

A personal knowledge base built from your own shipped repos. Give it a GitHub repo or local folder, and it creates markdown files you can browse, upload to Claude Project knowledge, or reuse while planning new work.

## What You Need

- Node.js 18 or newer.
- Git installed and available in your terminal.
- A Groq API key for the AI refine step: https://console.groq.com
- No npm packages to install.

## Step 0 - Set Your Key

PowerShell:

```powershell
$env:GROQ_API_KEY="your_key_here"
```

Mac/Linux:

```bash
export GROQ_API_KEY=your_key_here
```

Use `--bundle-only` when you want to create raw context without an API key.

## Best Flow - Import One GitHub Repo

```bash
npm run import -- https://github.com/owner/repo
```

What happens:

- The repo is cloned or updated under `brain/_repos/`.
- A raw context file is created under `brain/_staging/`.
- Groq turns that context into five markdown files under `brain/projects/<repo>/`.
- `brain/README.md` and `brain/index.html` are regenerated.

Useful options:

```bash
npm run import -- https://github.com/owner/repo --fresh
npm run import -- https://github.com/owner/repo --bundle-only
npm run import -- https://github.com/owner/repo --model openai/gpt-oss-120b
```

## Browse the Brain

```bash
npm run ui
```

Then open:

```text
brain/index.html
```

The dashboard gives you:

- Project cards with summaries.
- Search across project names and markdown.
- Tabs for overview, architecture, packages, implementations, gotchas, and raw context.
- A quick checklist for which files to upload to Claude Project knowledge.

## Build From Local Repos

Bundle one local repo:

```bash
npm run bundle -- /path/to/one-repo
```

Refine an existing context file:

```bash
npm run refine -- /path/to/one-repo/one-repo.context.md
```

Build every repo inside a parent folder:

```bash
npm run all -- /path/to/all-my-repos
```

Skip the AI step:

```bash
npm run all -- /path/to/all-my-repos --bundle-only
```

## Generated Files

Each refined project gets:

- `00-overview.md` - purpose, stack, status, useful entry points.
- `01-architecture.md` - folders, layers, request/data flow.
- `02-packages.md` - significant dependencies and why they matter.
- `03-implementations.md` - working patterns with real code snippets.
- `04-gotchas.md` - decisions, pitfalls, and deployment notes.
- `raw.context.md` - full bundled source context for deep follow-up.

## Use With Claude

1. Create a Claude Project called `My Code Brain`.
2. Upload `00-overview.md` through `04-gotchas.md` from each project folder.
3. Keep `raw.context.md` local unless you need deep source detail.

Good questions:

- "Which project used Supabase Realtime and how?"
- "Show the exact auth pattern I used before."
- "Compare the backend architecture in these two projects."
- "What code can I reuse for this new idea?"

## Capture New Ideas

```bash
npm run idea -- "AI resume tailor" --desc "tailors my resume per job description"
```

This creates:

```text
brain/ideas/YYYY-MM-DD-ai-resume-tailor.md
```

## Write Reusable Patterns

When you solve the same thing twice, copy:

```text
brain/patterns/_TEMPLATE.md
```

Examples:

- `auth-jwt-httponly.md`
- `nl2sql-groq.md`
- `supabase-realtime.md`

## Troubleshooting

- `Missing GROQ_API_KEY`: set the key or pass `--bundle-only`.
- `context was truncated`: raise `--maxchars` or split a huge repo.
- `No project folders found`: pass a parent folder that contains repo folders.
- `git clone` fails: check the repo URL and whether you have access.
- A file is too big and got skipped: check the `Skipped large files` section in `raw.context.md`.

## When to Upgrade to Real RAG

The markdown brain is enough until:

- Claude Project uploads become too large.
- Answers get fuzzy because too many projects are loaded.
- You want app/API retrieval instead of manual upload.

Then move to: chunk markdown, embed chunks, store in Supabase pgvector, and query through a small Express endpoint.

````
