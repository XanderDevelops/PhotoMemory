import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

function resolveRequestPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const cleanPath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = resolve(join(root, cleanPath));

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    return null;
  }

  return filePath;
}

const server = createServer((req, res) => {
  const requestedPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (/^\/PhotoMemoryDashboard(?:\/index\.html)?\/?$/i.test(requestedPath)) {
    res.writeHead(302, { Location: '/dashboard/' });
    res.end();
    return;
  }

  const filePath = resolveRequestPath(req.url || '/');

  if (!filePath || !existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const stats = statSync(filePath);
  if (stats.isDirectory()) {
    if (!requestedPath.endsWith('/')) {
      const query = (req.url || '').split('?')[1];
      const redirectLocation = requestedPath + '/' + (query ? '?' + query : '');
      res.writeHead(302, { Location: redirectLocation });
      res.end();
      return;
    }

    const indexFilePath = join(filePath, 'index.html');
    if (existsSync(indexFilePath) && statSync(indexFilePath).isFile()) {
      const contentType = mimeTypes['.html'];
      res.writeHead(200, { 'Content-Type': contentType });
      createReadStream(indexFilePath).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
  }

  if (!stats.isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const contentType = mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  createReadStream(filePath).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Photo Memory site running at http://127.0.0.1:${port}`);
});
