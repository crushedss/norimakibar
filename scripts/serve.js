#!/usr/bin/env node
/**
 * Dev server for History API routes (/concept, /lunch, etc.).
 * Do NOT use live-server --spa (hash URLs break css/js loading).
 */
const liveServer = require('live-server');

liveServer.start({
  port: 5173,
  open: '/concept',
  file: 'index.html',
  logLevel: 0,
});
