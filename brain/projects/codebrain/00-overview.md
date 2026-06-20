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
