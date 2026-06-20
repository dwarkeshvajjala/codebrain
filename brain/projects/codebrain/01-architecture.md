# codeBrain - Architecture

## Folder Layout

- `scripts/`: all executable CLI tools.
- `scripts/brain-import.js`: highest-level entry point for GitHub URLs and local folders.
- `scripts/brain-bundle.js`: walks a repo and writes one source-context markdown file.
- `scripts/brain-refine.js`: sends bundled context to Groq and writes project notes.
- `scripts/brain-ui.js`: reads `brain/projects/*` and generates the dashboard.
- `scripts/brain-all.js`: batch pipeline for every repo under one parent folder.
- `scripts/new-idea.js`: creates idea documents under `brain/ideas/`.
- `scripts/load-env.js`: minimal dependency-free `.env` loader.
- `brain/projects/`: one generated knowledge folder per project.
- `brain/patterns/`: hand-written reusable implementation patterns.
- `brain/ideas/`: dated idea plans.
- `brain/index.html`: generated static dashboard.
- `SETUP.md`: user-facing operating guide.

## Pipeline Flow

```text
GitHub URL or local repo
  -> brain-import.js
  -> brain-bundle.js
  -> brain/_staging/<repo>.context.md
  -> brain-refine.js + Groq
  -> brain/projects/<repo>/00..04.md + raw.context.md
  -> brain-ui.js
  -> brain/README.md + brain/index.html
```

## Bundle-Only Flow

```text
GitHub URL or local repo
  -> brain-import.js --bundle-only
  -> brain-bundle.js
  -> brain/projects/<repo>/raw.context.md
  -> fallback 00-overview.md
  -> brain-ui.js
```

## Data Boundaries

- Real secrets belong only in local `.env`.
- `.env.example` is tracked and safe to commit.
- `brain/_repos/` caches cloned GitHub repos and is ignored.
- `brain/_staging/` stores regenerated context files and is ignored.
- The useful project knowledge is committed under `brain/projects/`.
