import { defineConfig } from 'vite';

// Status server plugin for health monitoring
function statusServerPlugin() {
  let appState = {
    status: 'active',
    errors: [],
    scene: {
      objectCount: 0,
      rendering: false
    },
    startTime: Date.now()
  };

  return {
    name: 'status-server',
    configureServer(server) {
      // GET /status endpoint - returns current application state
      server.middlewares.use('/status', (req, res, next) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            ...appState,
            uptime: Date.now() - appState.startTime,
            timestamp: new Date().toISOString()
          }));
        } else if (req.method === 'POST') {
          // POST /status endpoint - updates application state
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const updates = JSON.parse(body);
              
              // Merge updates into appState
              if (updates.status) appState.status = updates.status;
              if (updates.errors) {
                // Append new errors to existing array
                appState.errors = [...appState.errors, ...updates.errors];
              }
              if (updates.scene) {
                appState.scene = { ...appState.scene, ...updates.scene };
              }
              
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [statusServerPlugin()],
  server: {
    port: 5173
  }
});
