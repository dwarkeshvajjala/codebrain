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
