'use strict';

/**
 * Creates the schema and loads demo data.
 *   npm run db:setup
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const env = require('../src/config/env');

const dbDir = path.resolve(__dirname, '..', '..', 'database');
const files = ['schema.sql', 'seed.sql'];

async function main() {
  const client = new Client(
    env.databaseUrl ? { connectionString: env.databaseUrl } : { ...env.pg }
  );

  await client.connect();
  console.log('[db] connected');

  for (const file of files) {
    const fullPath = path.join(dbDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    console.log(`[db] applying ${file}...`);
    await client.query(sql);
  }

  await client.end();
  console.log('[db] done. Schema and seed data are ready.');
}

main().catch((err) => {
  console.error('[db] setup failed:', err.message);
  process.exit(1);
});
