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
