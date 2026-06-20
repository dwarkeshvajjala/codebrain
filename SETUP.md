# Code Brain - Setup & Usage

A personal knowledge base built from your own shipped repos. Give it a GitHub repo or local folder, and it creates markdown files you can browse, upload to Claude Project knowledge, or reuse while planning new work.

## What You Need

- Node.js 18 or newer.
- Git installed and available in your terminal.
- A Groq API key for the AI refine step: https://console.groq.com
- No npm packages to install.

## Step 0 - Set Your Key

PowerShell:

```powershell
$env:GROQ_API_KEY="your_key_here"
```

Mac/Linux:

```bash
export GROQ_API_KEY=your_key_here
```

Use `--bundle-only` when you want to create raw context without an API key.

## Best Flow - Import One GitHub Repo

```bash
npm run import -- https://github.com/owner/repo
```

What happens:

- The repo is cloned or updated under `brain/_repos/`.
- A raw context file is created under `brain/_staging/`.
- Groq turns that context into five markdown files under `brain/projects/<repo>/`.
- `brain/README.md` and `brain/index.html` are regenerated.

Useful options:

```bash
npm run import -- https://github.com/owner/repo --fresh
npm run import -- https://github.com/owner/repo --bundle-only
npm run import -- https://github.com/owner/repo --model openai/gpt-oss-120b
```

## Browse the Brain

```bash
npm run ui
```

Then open:

```text
brain/index.html
```

The dashboard gives you:

- Project cards with summaries.
- Search across project names and markdown.
- Tabs for overview, architecture, packages, implementations, gotchas, and raw context.
- A quick checklist for which files to upload to Claude Project knowledge.

## Build From Local Repos

Bundle one local repo:

```bash
npm run bundle -- /path/to/one-repo
```

Refine an existing context file:

```bash
npm run refine -- /path/to/one-repo/one-repo.context.md
```

Build every repo inside a parent folder:

```bash
npm run all -- /path/to/all-my-repos
```

Skip the AI step:

```bash
npm run all -- /path/to/all-my-repos --bundle-only
```

## Generated Files

Each refined project gets:

- `00-overview.md` - purpose, stack, status, useful entry points.
- `01-architecture.md` - folders, layers, request/data flow.
- `02-packages.md` - significant dependencies and why they matter.
- `03-implementations.md` - working patterns with real code snippets.
- `04-gotchas.md` - decisions, pitfalls, and deployment notes.
- `raw.context.md` - full bundled source context for deep follow-up.

## Use With Claude

1. Create a Claude Project called `My Code Brain`.
2. Upload `00-overview.md` through `04-gotchas.md` from each project folder.
3. Keep `raw.context.md` local unless you need deep source detail.

Good questions:

- "Which project used Supabase Realtime and how?"
- "Show the exact auth pattern I used before."
- "Compare the backend architecture in these two projects."
- "What code can I reuse for this new idea?"

## Capture New Ideas

```bash
npm run idea -- "AI resume tailor" --desc "tailors my resume per job description"
```

This creates:

```text
brain/ideas/YYYY-MM-DD-ai-resume-tailor.md
```

## Write Reusable Patterns

When you solve the same thing twice, copy:

```text
brain/patterns/_TEMPLATE.md
```

Examples:

- `auth-jwt-httponly.md`
- `nl2sql-groq.md`
- `supabase-realtime.md`

## Troubleshooting

- `Missing GROQ_API_KEY`: set the key or pass `--bundle-only`.
- `context was truncated`: raise `--maxchars` or split a huge repo.
- `No project folders found`: pass a parent folder that contains repo folders.
- `git clone` fails: check the repo URL and whether you have access.
- A file is too big and got skipped: check the `Skipped large files` section in `raw.context.md`.

## When to Upgrade to Real RAG

The markdown brain is enough until:

- Claude Project uploads become too large.
- Answers get fuzzy because too many projects are loaded.
- You want app/API retrieval instead of manual upload.

Then move to: chunk markdown, embed chunks, store in Supabase pgvector, and query through a small Express endpoint.
