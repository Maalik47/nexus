'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),

  databaseUrl: process.env.DATABASE_URL || '',
  pg: {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'nexusgear',
    password: process.env.PGPASSWORD || 'nexusgear',
    database: process.env.PGDATABASE || 'nexusgear'
  },

  jwtSecret: required('JWT_SECRET', 'change-me-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',

  externalApiKey: process.env.EXTERNAL_API_KEY || 'change-me-external',

  corsOrigins: (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  externalApi: {
    baseUrl: process.env.EXTERNAL_API_BASE_URL || '',
    keyHeader: process.env.EXTERNAL_API_KEY_HEADER || 'Authorization',
    keyValue: process.env.EXTERNAL_API_KEY_VALUE || '',
    reportsPath: process.env.EXTERNAL_REPORTS_PATH || '/reports/sales',
    recordsPath: process.env.EXTERNAL_RECORDS_PATH || '',
    itemsPath: process.env.EXTERNAL_ITEMS_PATH || '',
    timeoutMs: Number(process.env.EXTERNAL_API_TIMEOUT_MS || 10000)
  }
};

env.isProd = env.nodeEnv === 'production';

module.exports = env;
