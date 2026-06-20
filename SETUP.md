# Code Brain - React + Express App

Code Brain turns GitHub repositories into a local markdown knowledge base.

Paste a GitHub URL, let the backend clone and scan it, generate project markdown with Groq, then browse the result in the React brain dashboard.

## Current Product Workflow

1. Open the React app.
2. Paste a GitHub repo URL.
3. The Express backend creates an autonomous import job.
4. The job clones the repo into `brain/_runs/<job>/`.
5. The existing bundler scans source files and skips secrets, binaries, build folders, and huge files.
6. Groq refines the raw context into markdown:
   - `00-overview.md`
   - `01-architecture.md`
   - `02-packages.md`
   - `03-implementations.md`
   - `04-gotchas.md`
   - `raw.context.md`
7. The dashboard refreshes.
8. The temporary cloned repo is deleted automatically by default.

## Run Locally

Create local `.env`:

```powershell
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Install dependencies:

```bash
npm install
```

Run app:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

API runs at:

```text
http://127.0.0.1:4000
```

## Important Folders

- `client/` - React/Vite frontend.
- `server/` - Express backend and import job API.
- `scripts/brain-bundle.js` - repo scanner/context bundler.
- `scripts/brain-refine.js` - Groq markdown generator.
- `brain/projects/` - generated project knowledge.
- `brain/_runs/` - temporary clones, ignored and deleted after import.
- `brain/_staging/` - generated raw context staging, ignored.

## API

- `GET /api/health`
- `GET /api/projects`
- `GET /api/projects/:slug`
- `POST /api/import`
- `GET /api/jobs/:id`

`POST /api/import` body:

```json
{
  "repoUrl": "https://github.com/owner/repo",
  "cleanup": true,
  "maxChars": 30000,
  "maxKb": 120
}
```

## Optional Supabase Later

Right now the app uses local markdown as the source of truth.

Supabase can be added later for:

- saved import history
- project metadata
- job history
- embeddings/vector search
- multi-device sync

Use `.env.example` placeholders only in git. Keep real Supabase keys local and rotate any key that was pasted into chat.

## Build

```bash
npm run build
npm start
```

In production mode, Express serves the built React app from `dist/`.
