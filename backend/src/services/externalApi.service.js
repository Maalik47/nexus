'use strict';

const axios = require('axios');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Outbound integration layer.
 *
 * The system is able to consume third-party APIs (payment gateways, shipping,
 * exchange rates, ERP, etc.) through this single, configurable client. External
 * endpoints are declared in `EXTERNAL_API_BASE_URL` and authenticated with the
 * configured header/value. This keeps the integration points centralized and
 * swappable, as required by the architecture (cliente-servidor + API REST).
 */
const client = axios.create({
  baseURL: env.externalApi.baseUrl || undefined,
  timeout: env.externalApi.timeoutMs,
  headers: { 'Content-Type': 'application/json' }
});

function buildAuthHeaders(override = {}) {
  const headers = { ...override };
  if (env.externalApi.keyValue && !headers[env.externalApi.keyHeader]) {
    headers[env.externalApi.keyHeader] = env.externalApi.keyValue;
  }
  return headers;
}

async function request({ method = 'GET', url, path, data, params, headers } = {}) {
  const target = url || path;
  if (!target) throw ApiError.badRequest('Se requiere "url" o "path" externo');

  if (!env.externalApi.baseUrl && !/^https?:\/\//i.test(target)) {
    throw ApiError.badRequest(
      'EXTERNAL_API_BASE_URL no está configurada. Proporciona una url absoluta o define la variable.'
    );
  }

  try {
    const response = await client.request({
      method,
      url: target,
      data,
      params,
      headers: buildAuthHeaders(headers)
    });
    return {
      status: response.status,
      data: response.data
    };
  } catch (err) {
    if (err.response) {
      throw new ApiError(err.response.status, `Error de la API externa: ${err.response.statusText}`, err.response.data);
    }
    if (err.code === 'ECONNABORTED') {
      throw new ApiError(504, 'La API externa tardó demasiado en responder');
    }
    throw new ApiError(502, `No se pudo conectar con la API externa: ${err.message}`);
  }
}

async function getStatus() {
  const configured = Boolean(env.externalApi.baseUrl);
  const status = { configured, baseUrl: env.externalApi.baseUrl || null, reachable: null };
  if (!configured) return status;

  try {
    await client.get('/', { timeout: Math.min(env.externalApi.timeoutMs, 3000) });
    status.reachable = true;
  } catch (err) {
    // A 4xx also proves the host is reachable
    status.reachable = Boolean(err.response);
  }
  return status;
}

module.exports = { request, getStatus };
