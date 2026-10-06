'use strict';

const { Pool } = require('pg');
const env = require('./env');

const poolConfig = env.databaseUrl
  ? { connectionString: env.databaseUrl }
  : { ...env.pg };

const pool = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[db] Unexpected idle client error', err.message);
});

async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (env.nodeEnv !== 'test' && duration > 750) {
    // eslint-disable-next-line no-console
    console.warn('[db] slow query', { duration, text: text.slice(0, 120) });
  }
  return result;
}

async function withTransaction(handler) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function healthCheck() {
  const { rows } = await query('SELECT 1 AS ok');
  return rows[0]?.ok === 1;
}

module.exports = { pool, query, withTransaction, healthCheck };
