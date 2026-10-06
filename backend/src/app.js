'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimit.middleware');

const app = express();

// Behind a reverse proxy (nginx, containers) so rate-limit/IP work correctly.
app.set('trust proxy', 1);

app.use(helmet());

const allowAll = env.corsOrigins.includes('*');
app.use(
  cors({
    origin: allowAll ? true : env.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    exposedHeaders: ['Content-Disposition'],
    credentials: !allowAll
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use('/api', apiLimiter);

// OpenAPI contract + Swagger UI: lets any software discover and consume the API.
app.get('/api/openapi.json', (req, res) => res.json(swaggerSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'NexusGear API' }));

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime(), env: env.nodeEnv } });
});

app.use('/api/v1', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
