'use strict';

const env = require('../config/env');

function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    error: { message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` }
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const payload = {
    success: false,
    error: {
      message: status === 500 && env.isProd ? 'Error interno del servidor' : err.message
    }
  };

  if (err.details) payload.error.details = err.details;
  if (!env.isProd && status === 500) payload.error.stack = err.stack;

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
