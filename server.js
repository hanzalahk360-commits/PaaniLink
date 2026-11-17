// PaaniLink student-level mock REST API and static file server.
// Uses only Node.js built-in modules; no external package is required.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PUBLIC_DIR = path.join(__dirname, 'public');
const DEFAULT_DB = path.join(__dirname, 'db.json');
const RESOURCES = ['zones', 'hydrants', 'tankers', 'rates', 'users', 'bookings'];
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

function send(res, status, data, contentType = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(contentType.startsWith('application/json') ? JSON.stringify(data) : data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        const value = JSON.parse(raw);
        if (!value || Array.isArray(value) || typeof value !== 'object') {
          return reject(new Error('Request body must be a JSON object.'));
        }
        resolve(value);
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });
    req.on('error', reject);
  });
}

function createServer(options = {}) {
  const dbPath = options.dbPath || process.env.PAANILINK_DB || DEFAULT_DB;

  function readDb() {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }

  function writeDb(data) {
    const temporaryPath = `${dbPath}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(data, null, 2)}\n`);
    fs.renameSync(temporaryPath, dbPath);
  }

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let parts;
      try {
        parts = url.pathname.split('/').filter(Boolean).map(part => decodeURIComponent(part));
      } catch {
        return send(res, 400, { error: 'Invalid URL path.' });
      }

      if (url.pathname === '/health' && req.method === 'GET') {
        return send(res, 200, { status: 'ok', project: 'PaaniLink Mock API' });
      }

      // Mock REST API: /users, /bookings/1, /rates, and other listed resources.
      if (parts.length && RESOURCES.includes(parts[0])) {
        const resource = parts[0];
        const id = parts[1];
        if (parts.length > 2) return send(res, 404, { error: 'Endpoint not found.' });
        const db = readDb();
        const rows = db[resource];
        if (!Array.isArray(rows)) return send(res, 404, { error: 'Resource not found.' });

        if (req.method === 'GET') {
          if (id !== undefined) {
            const item = rows.find(row => String(row.id) === id);
            return item ? send(res, 200, item) : send(res, 404, { error: 'Record not found.' });
          }

          let result = rows.slice();
          for (const [key, value] of url.searchParams.entries()) {
            if (key.startsWith('_')) continue;
            result = result.filter(row => String(row[key]) === value);
          }
          const sortField = url.searchParams.get('_sort');
          const direction = url.searchParams.get('_order') === 'desc' ? -1 : 1;
          if (sortField) {
            result.sort((a, b) => {
              if (a[sortField] === b[sortField]) return 0;
              return (a[sortField] > b[sortField] ? 1 : -1) * direction;
            });
          }
          const limit = Number(url.searchParams.get('_limit'));
          const page = Math.max(1, Number(url.searchParams.get('_page')) || 1);
          if (Number.isInteger(limit) && limit > 0) {
            result = result.slice((page - 1) * limit, page * limit);
          }
          return send(res, 200, result);
        }

        if (req.method === 'POST' && id === undefined) {
          const body = await readBody(req);
          const nextId = rows.reduce((maximum, row) => Math.max(maximum, Number(row.id) || 0), 0) + 1;
          const item = { ...body, id: body.id === undefined ? nextId : body.id };
          rows.push(item);
          writeDb(db);
          return send(res, 201, item);
        }

        if (['PATCH', 'PUT', 'DELETE'].includes(req.method) && id !== undefined) {
          const index = rows.findIndex(row => String(row.id) === id);
          if (index < 0) return send(res, 404, { error: 'Record not found.' });
          if (req.method === 'DELETE') {
            const removed = rows.splice(index, 1)[0];
            writeDb(db);
            return send(res, 200, removed);
          }
          const body = await readBody(req);
          rows[index] = req.method === 'PATCH'
            ? { ...rows[index], ...body, id: rows[index].id }
            : { ...body, id: rows[index].id };
          writeDb(db);
          return send(res, 200, rows[index]);
        }
        return send(res, 405, { error: 'Method not allowed for this endpoint.' });
      }

      // Static frontend files. / opens the login page.
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return send(res, 405, { error: 'Method not allowed.' });
      }
      const requested = parts.length ? parts.join('/') : 'index.html';
      const filePath = path.resolve(PUBLIC_DIR, requested);
      if (filePath !== PUBLIC_DIR && !filePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
        return send(res, 403, { error: 'Access denied.' });
      }
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return send(res, 404, { error: 'Page not found.' });
      }
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': CONTENT_TYPES[path.extname(filePath)] || 'application/octet-stream' });
      return req.method === 'HEAD' ? res.end() : res.end(content);
    } catch (error) {
      const clientError = /valid JSON|JSON object|too large/.test(error.message);
      return send(res, clientError ? 400 : 500, { error: error.message || 'Unexpected server error.' });
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, '0.0.0.0', () => {
    console.log(`PaaniLink is running at http://localhost:${port}`);
    console.log(`Mock API health check: http://localhost:${port}/health`);
  });
}

module.exports = { createServer };
