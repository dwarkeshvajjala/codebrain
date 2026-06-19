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
