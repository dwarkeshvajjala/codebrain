#!/usr/bin/env node
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const NODE = process.execPath;

const processes = [
  {
    name: 'api',
    command: NODE,
    args: [path.join(ROOT, 'server', 'index.js')],
  },
  {
    name: 'ui',
    command: NODE,
    args: [
      path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      '5173',
    ],
  },
];

function prefixLines(name, data, stream) {
  for (const line of String(data).split(/\r?\n/)) {
    if (line.trim()) stream.write(`[${name}] ${line}\n`);
  }
}

function start({ name, command, args }) {
  const child = spawn(command, args, {
    cwd: ROOT,
    env: process.env,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', data => prefixLines(name, data, process.stdout));
  child.stderr.on('data', data => prefixLines(name, data, process.stderr));
  child.on('exit', code => {
    if (!stopping) {
      console.error(`[${name}] exited with code ${code}`);
      stopAll(code || 1);
    }
  });
  return child;
}

let stopping = false;
const children = processes.map(start);

function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  setTimeout(() => process.exit(code), 250);
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

console.log('Code Brain dev server starting...');
console.log('API: http://127.0.0.1:4000');
console.log('UI:  http://127.0.0.1:5173');
