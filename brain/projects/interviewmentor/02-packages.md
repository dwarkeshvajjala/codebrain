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
