'use strict';

const app = require('./app');
const env = require('./config/env');
const { healthCheck } = require('./config/db');

async function start() {
  try {
    await healthCheck();
    // eslint-disable-next-line no-console
    console.log('[db] connection established');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[db] could not reach PostgreSQL:', err.message);
    // eslint-disable-next-line no-console
    console.warn('[db] the API will start, but data endpoints will fail until the DB is available.');
  }

  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`NexusGear API listening on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`API docs:  http://localhost:${env.port}/api/docs`);
  });

  const shutdown = (signal) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received, shutting down...`);
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
