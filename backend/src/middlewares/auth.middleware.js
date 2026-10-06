'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

/**
 * Requires a valid user JWT OR a valid external API key (server-to-server).
 */
function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === env.externalApiKey) {
    req.integration = { name: 'external-api', via: 'api-key' };
    return next();
  }

  const token = extractToken(req);
  if (!token) {
    return next(ApiError.unauthorized('Falta el token Bearer o la clave x-api-key'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
    return next();
  } catch (err) {
    return next(ApiError.unauthorized('Token inválido o expirado'));
  }
}

function optionalAuthenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === env.externalApiKey) {
    req.integration = { name: 'external-api', via: 'api-key' };
    return next();
  }
  const token = extractToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, env.jwtSecret);
      req.user = { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
    } catch (err) {
      // ignore invalid token for optional auth
    }
  }
  return next();
}

function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (req.integration) return next();
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requiere el rol: ${roles.join(' o ')}`));
    }
    return next();
  };
}

module.exports = { authenticate, optionalAuthenticate, requireRole };
