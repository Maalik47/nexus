'use strict';

const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Demasiadas solicitudes, inténtalo de nuevo más tarde.' }
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Demasiados intentos de autenticación, inténtalo de nuevo más tarde.' }
  }
});

module.exports = { apiLimiter, authLimiter };
