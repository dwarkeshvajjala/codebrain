#!/usr/bin/env node
const fs = require('fs');
const http = require('http');
const path = require('path');

const port = Number(process.env.PORT || 8765);
const host = process.env.HOST || '127.0.0.1';
const root = path.resolve(__dirname, '..', 'brain');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${host}:${port}`);
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const fullPath = path.resolve(root, `.${requested}`);

  if (!fullPath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, {
      'content-type': types[path.extname(fullPath)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`Code Brain dashboard: http://${host}:${port}/index.html`);
});
