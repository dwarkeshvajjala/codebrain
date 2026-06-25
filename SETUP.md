# Code Brain - React + Express App

Code Brain turns GitHub repositories into a local markdown knowledge base.

Paste a GitHub URL, let the backend clone and scan it, then browse the result in the React brain dashboard. With `GROQ_API_KEY` configured, imports also generate structured project markdown with Groq.

## Current Product Workflow

1. Open the React app.
2. Paste one GitHub repo URL, or paste multiple GitHub URLs separated by spaces, commas, or new lines.
3. The Express backend normalizes supported GitHub formats and queues autonomous import jobs.
4. The job clones the repo into `brain/_runs/<job>/`.
5. The bundler scans source files, skips secrets/binaries/build folders/huge files, and summarizes large data or notebook assets so code context keeps priority.
6. If `GROQ_API_KEY` is configured, Groq refines the raw context into markdown. Large contexts are split into chunks first, then merged so later files are not lost:
   - `00-overview.md`
   - `01-architecture.md`
   - `02-packages.md`
   - `03-implementations.md`
   - `04-gotchas.md`
   - `raw.context.md`
7. The dashboard refreshes.
8. The temporary cloned repo is deleted automatically by default.

## Run Locally

Create local `.env` for AI refinement:

```powershell
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Without `GROQ_API_KEY`, imports still work in raw-context mode.

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
- `POST /api/import-bulk`
- `DELETE /api/projects/:slug`
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

Supported URL inputs include `https://github.com/owner/repo`, `github.com/owner/repo`, `https://github.com/owner/repo/tree/main`, and `git@github.com:owner/repo.git`. They are normalized before cloning.

`POST /api/import-bulk` body:

```json
{
  "urls": [
    "https://github.com/owner/repo",
    "github.com/owner/another-repo"
  ],
  "cleanup": true,
  "maxChars": 30000,
  "maxKb": 120
}
```

Bulk import returns `{ jobs, warnings }`. Invalid or duplicate repo inputs are skipped with warnings. The backend keeps a conservative import queue; set `CODE_BRAIN_IMPORT_CONCURRENCY=2` or `3` locally if you want more parallel imports.

`maxChars` is the approximate per-call chunk size for Groq refinement. It no longer truncates the project context.

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
