'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Tiny declarative body validator.
 * rules = { field: { required, type, min, max, enum, email } }
 */
function validateBody(rules) {
  return function validate(req, res, next) {
    const errors = [];
    const body = req.body || {};

    for (const [field, rule] of Object.entries(rules)) {
      const value = body[field];
      const empty = value === undefined || value === null || value === '';

      if (rule.required && empty) {
        errors.push({ field, message: 'es obligatorio' });
        continue;
      }
      if (empty) continue;

      if (rule.type === 'number' && Number.isNaN(Number(value))) {
        errors.push({ field, message: 'debe ser un número' });
      }
      if (rule.type === 'array' && !Array.isArray(value)) {
        errors.push({ field, message: 'debe ser un arreglo' });
      }
      if (rule.type === 'string' && typeof value !== 'string') {
        errors.push({ field, message: 'debe ser texto' });
      }
      if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        errors.push({ field, message: 'debe ser un correo válido' });
      }
      if (rule.min !== undefined && String(value).length < rule.min) {
        errors.push({ field, message: `debe tener al menos ${rule.min} caracteres` });
      }
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({ field, message: `debe ser uno de: ${rule.enum.join(', ')}` });
      }
      if (rule.positive && Number(value) <= 0) {
        errors.push({ field, message: 'debe ser mayor que 0' });
      }
    }

    if (errors.length) {
      return next(ApiError.badRequest('Datos inválidos', errors));
    }
    return next();
  };
}

module.exports = { validateBody };
