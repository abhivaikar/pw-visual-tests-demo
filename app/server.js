'use strict';

/**
 * Minimal Express static server for the pw-visual-tests-demo app.
 *
 * Every page lives as a plain HTML file under ./public and is served as-is.
 * No framework, no build step, no bundler — just static HTML + CSS.
 *
 * Start with: npm start  ->  http://localhost:3000
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Disable etag/caching so screenshots are always taken against fresh content.
app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Pretty routes -> html files. Keeps URLs clean (e.g. /components).
const ROUTES = {
  '/': 'index.html',
  '/components': 'components.html',
  '/dynamic': 'dynamic.html',
  '/themes': 'themes.html',
  '/states': 'states.html',
  '/slow': 'slow.html',
};

for (const [route, file] of Object.entries(ROUTES)) {
  app.get(route, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, file));
  });
}

// Static assets (styles.css, any future images, etc.).
app.use(express.static(PUBLIC_DIR));

// Fallback 404 so missing routes are obvious in tests.
app.use((req, res) => {
  res.status(404).send('Not found');
});

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`pw-visual-tests-demo app running at http://localhost:${PORT}`);
});

// Graceful shutdown. server.close() alone waits for keep-alive connections
// (e.g. an open browser tab) to drain, which can hang Ctrl+C — so we also
// force-close existing sockets and guard against repeated signals.
let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close(() => process.exit(0));
  // Available in Node 18.2+; drops lingering keep-alive connections so the
  // close callback can actually fire.
  server.closeAllConnections?.();
  // Hard fallback in case anything is still holding the loop open.
  setTimeout(() => process.exit(0), 1000).unref();
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, shutdown);
}

module.exports = app;
