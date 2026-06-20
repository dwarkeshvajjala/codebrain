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
