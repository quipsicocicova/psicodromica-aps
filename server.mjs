import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = import.meta.dirname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
createServer(async (req, res) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const file = path === root ? resolve(root, 'index.html') : path;
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(content);
  } catch { res.writeHead(404).end('Pagina non trovata'); }
}).listen(Number(process.env.PORT || 5176), '0.0.0.0', () => console.log('Psicodromica → http://localhost:' + (process.env.PORT || 5176)));
