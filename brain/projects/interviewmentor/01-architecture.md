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
