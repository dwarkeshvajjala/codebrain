# Code Brain — Setup & Usage

A personal knowledge base built from your own shipped repos. Ask questions, get YOUR working code back.

---

## What you need
- Node.js 18 or newer (you have 22 — good)
- A Groq API key → https://console.groq.com (free tier works)
- Nothing to install. No npm packages.

---

## Step 0 — Set your key
Mac/Linux:
```
export GROQ_API_KEY=your_key_here
```
Windows PowerShell:
```
$env:GROQ_API_KEY="your_key_here"
```

---

## Step 1 — Build one project (try this first)
```
node scripts/brain-bundle.js /path/to/one-repo
node scripts/brain-refine.js /path/to/one-repo/one-repo.context.md
```
Result: `brain/projects/<repo>/` with `00-overview.md` … `04-gotchas.md` + `raw.context.md`.
Open them. Make sure the content looks right before doing all 20.

---

## Step 2 — Build all your repos at once
Put all repos under one parent folder, then:
```
node scripts/brain-all.js /path/to/all-my-repos
```
- Bundles + refines every subfolder.
- `brain/README.md` index rebuilds automatically.
- Add `--bundle-only` to skip the AI step (no key needed, just raw context files).
- Add `--model openai/gpt-oss-120b` for deeper code reasoning.

---

## Step 3 — Query the brain (manual, today)
1. Go to claude.ai → create a **Project** called "My Code Brain".
2. Upload the `00`–`04` markdown files from each `brain/projects/*` into Project knowledge.
   (Skip `raw.context.md` to keep the Project lean — paste it manually when you need deep detail.)
3. Ask things like:
   - "How did I implement JWT + HttpOnly refresh in Screeno? Give me the code."
   - "Which project used Supabase Realtime and how?"
   - "Compare how I structured the .NET backend in ApnaNest vs the movie booking app."

---

## Step 4 — Capture new ideas (the brain grows)
```
node scripts/new-idea.js "AI resume tailor" --desc "tailors my resume per job description"
```
- Saves a structured plan to `brain/ideas/YYYY-MM-DD-ai-resume-tailor.md`.
- It references your existing projects so ideas reuse what you already built.

---

## Step 5 — Write patterns by hand (highest value)
When you solve the same thing twice, copy `brain/patterns/_TEMPLATE.md` and fill it in.
Examples: `auth-jwt-httponly.md`, `nl2sql-groq.md`, `supabase-realtime.md`.

---

## npm shortcuts (optional)
Pass args after `--`:
```
npm run bundle -- /path/to/repo
npm run all    -- /path/to/all-my-repos
npm run idea   -- "My new idea"
```

---

## When to upgrade to RAG (Phase 3)
Switch from manual Claude Project to automated retrieval when:
- You hit Project upload limits, OR
- Answers get fuzzy because too many files load at once.

Then: chunk the MD → embed → Supabase pgvector → small Express endpoint (plain fetch + Groq).
Same stack you already use.

---

## Troubleshooting
- "Missing GROQ_API_KEY" → set it (Step 0) or use `--bundle-only`.
- "context was truncated" → raise `--maxchars` or split a huge repo.
- Refine missing sections → re-run, or try `--model openai/gpt-oss-120b`.
- A file is too big and got skipped → it's logged under "Skipped large files" in the context.md.
