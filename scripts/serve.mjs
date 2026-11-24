import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.ARTIFEX_PORT ?? 4173);
const host = process.env.ARTIFEX_HOST ?? '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

createServer(async (request, response) => {
  try {
    const { pathname, search } = new URL(request.url, 'http://localhost');
    const route = decodeURIComponent(pathname).replace(/^\/Artifex(?=\/)/u, '');
    const file = resolve(root, `.${route.endsWith('/') ? `${route}index.html` : route}`);
    if (!file.startsWith(resolve(root) + sep)) {
      response.writeHead(404).end('Página no encontrada');
      return;
    }

    if (!route.endsWith('/') && (await stat(file)).isDirectory()) {
      response.writeHead(308, { Location: pathname + '/' + search }).end();
      return;
    }
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' }).end(content);
  } catch {
    response.writeHead(404).end('Página no encontrada');
  }
}).listen(port, host, () => console.log(`Artifex · http://${host}:${port}/`));
