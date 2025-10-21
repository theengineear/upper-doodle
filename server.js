import http from 'http';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Parse URL to separate pathname from query string
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let filePath = '.' + parsedUrl.pathname;
  if (filePath === './') {
    filePath = './index.html';
  }

  // Remove trailing slash if present
  if (filePath.endsWith('/')) {
    filePath = filePath.slice(0, -1);
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.ttl': 'text/turtle',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.woff2': 'font/woff2',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // First check if the path is a directory or doesn't have an extension
  if (extname === '') {
    // Try to check if it's a directory or if index.html exists
    const indexPath = path.join(filePath, 'index.html');
    fs.readFile(indexPath, (indexError, indexContent) => {
      if (!indexError) {
        // Found index.html in directory - redirect to add trailing slash
        if (!parsedUrl.pathname.endsWith('/')) {
          const redirectUrl = parsedUrl.pathname + '/' + parsedUrl.search;
          res.writeHead(301, { 'Location': redirectUrl });
          res.end();
        } else {
          // Already has trailing slash, serve the file
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexContent, 'utf-8');
        }
      } else {
        // No index.html, try the original path as-is
        fs.readFile(filePath, (error, content) => {
          if (error) {
            res.writeHead(404);
            res.end('File not found');
          } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
          }
        });
      }
    });
  } else {
    // Has extension, read directly
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404);
          res.end('File not found');
        } else {
          res.writeHead(500);
          res.end('Server error: ' + error.code);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  }
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at http://localhost:${port}/`);
});
