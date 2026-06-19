#!/usr/bin/env node
/**
 * new-idea.js
 * Generate a structured idea document for the brain (the "grows over time" part).
 * Pulls the brain index for context so ideas connect to what you already built.
 *
 * Setup (Node 18+):  export GROQ_API_KEY=...
 *
 * Usage:
 *   node new-idea.js "AI resume tailor"
 *   node new-idea.js "AI resume tailor" --desc "tailors my resume per job description"
 *   node new-idea.js "X" --out ./brain --model openai/gpt-oss-120b
 */

const fs = require('fs');
const path = require('path');

// ---------- args ----------
const USAGE = `Usage: node scripts/new-idea.js "<idea title>" [--desc "..."] [--out ./brain] [--model name]

Options:
  --desc text    Short description to guide the idea plan.
  --out dir      Brain folder. Default: ./brain.
  --model name   Groq model to use. Default: llama-3.3-70b-versatile.
  -h, --help     Show this help.`;

const args = process.argv.slice(2);
let title = null;
let desc = '';
let brainDir = path.resolve('./brain');
let model = 'llama-3.3-70b-versatile';

function readOptionValue(flag, index) {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error(`Missing value for ${flag}\n\n${USAGE}`);
    process.exit(1);
  }
  return value;
}

if (args.includes('-h') || args.includes('--help')) {
  console.log(USAGE);
  process.exit(0);
}

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--desc') desc = readOptionValue(a, i++);
  else if (a === '--out') brainDir = path.resolve(readOptionValue(a, i++));
  else if (a === '--model') model = readOptionValue(a, i++);
  else if (a.startsWith('--')) {
    console.error(`Unknown option: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
  else if (!a.startsWith('--') && !title) title = a;
  else {
    console.error(`Unexpected argument: ${a}\n\n${USAGE}`);
    process.exit(1);
  }
}

if (!title) {
  console.error(USAGE);
  process.exit(1);
}
if (!process.env.GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY environment variable.');
  process.exit(1);
}

// ---------- context from existing brain ----------
let indexContext = '';
const readme = path.join(brainDir, 'README.md');
if (fs.existsSync(readme)) indexContext = fs.readFileSync(readme, 'utf8').slice(0, 4000);

const date = new Date().toISOString().slice(0, 10);
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const prompt = `You are a pragmatic senior engineer helping plan a new project idea.

Existing projects in this developer's brain (for reuse and context):
${indexContext || '(none yet)'}

New idea title: ${title}
${desc ? `Short description: ${desc}` : ''}

Write ONE concise, scannable markdown plan. Short bullets, short lines, grouped. No long paragraphs.
Where useful, point to which existing project's patterns could be reused.
Use these sections exactly:

# ${title}

## Problem / why
## Core idea
## Suggested stack
## Build phases
## Reuse from existing projects
## Risks / open questions
## First concrete step`;

async function main() {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error(`Groq error ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  const text = (data.choices?.[0]?.message?.content || '').trim();

  const ideasDir = path.join(brainDir, 'ideas');
  fs.mkdirSync(ideasDir, { recursive: true });
  const outPath = path.join(ideasDir, `${date}-${slug}.md`);
  fs.writeFileSync(outPath, text + '\n');
  console.log(`Idea saved -> ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
