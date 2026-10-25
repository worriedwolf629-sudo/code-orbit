import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'vault-data.json');

// Global list of active SSE client responses
const sseClients = new Set();

export function syncPlugin(initialData = {}) {
  return {
    name: 'codeorbit-sync-plugin',
    configureServer(server) {
      // Initialize vault-data.json if it doesn't exist
      if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        // CORS headers so local network and tunnel connections work seamlessly
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        // GET /api/vault - Return current synced vault data
        if (req.method === 'GET' && url === '/api/vault') {
          try {
            if (fs.existsSync(DATA_FILE)) {
              const content = fs.readFileSync(DATA_FILE, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(content);
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(initialData));
            }
          } catch (err) {
            console.error('Error reading vault data:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // POST /api/vault - Update vault data from laptop or mobile
        if (req.method === 'POST' && url === '/api/vault') {
          try {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf-8');

                // Broadcast update to all connected SSE clients (laptop & phone)
                const payload = `data: ${JSON.stringify({ type: 'sync', updatedAt: Date.now() })}\n\n`;
                for (const client of sseClients) {
                  try {
                    client.write(payload);
                  } catch (e) {
                    sseClients.delete(client);
                  }
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
              } catch (parseErr) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
              }
            });
          } catch (err) {
            console.error('Error writing vault data:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // GET /api/vault/events - Real-time Server-Sent Events (SSE)
        if (req.method === 'GET' && url === '/api/vault/events') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          });

          res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);
          sseClients.add(res);

          req.on('close', () => {
            sseClients.delete(res);
          });
          return;
        }

        next();
      });
    }
  };
}
