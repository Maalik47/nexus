'use strict';

const externalApi = require('./externalApi.service');
const env = require('../config/env');

/**
 * Adapter for the OTHER software's REST API.
 *
 * Works with two kinds of response:
 *   1. A flat array of sales rows (the other system mirrors our shape).
 *   2. A nested structure, e.g. DummyJSON carts: { carts: [{ id, userId,
 *      products: [{ title, price, quantity, total }] }] }.
 *
 * `EXTERNAL_RECORDS_PATH` points to the array of records and `EXTERNAL_ITEMS_PATH`
 * points to the nested line items inside each record. Nested items are flattened
 * into one row per line, tagged with `source: 'external'` so the merged report can
 * tell our data apart from the third party's.
 */

function pick(obj, keys, fallback) {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function getByPath(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, key) => (acc === null || acc === undefined ? acc : acc[key]), obj);
}

function extractArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.rows)) return payload.data.rows;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function normalizeLine(record, item) {
  const quantity = toNumber(pick(item, ['quantity', 'cantidad', 'cant', 'qty'], 1), 1);
  const unitPrice = toNumber(pick(item, ['unit_price', 'precio_unitario', 'price', 'precio'], 0), 0);
  const lineTotal = toNumber(
    pick(item, ['line_total', 'total', 'importe', 'total_linea'], unitPrice * quantity),
    unitPrice * quantity
  );
  const buyerId = pick(record, ['userId', 'user_id', 'customer_id'], '?');

  return {
    source: 'external',
    invoice_id: pick(record, ['invoice_id', 'factura', 'order_id', 'id'], null),
    date: pick(record, ['date', 'fecha', 'issued_at', 'created_at'], new Date().toISOString()),
    user_name: pick(record, ['user_name', 'usuario', 'customer', 'cliente'], `Cliente externo #${buyerId}`),
    category_name: pick(
      item,
      ['category_name', 'categoria', 'category'],
      pick(record, ['category_name', 'categoria', 'category'], 'Externo')
    ),
    product_name: pick(item, ['product_name', 'producto', 'item', 'name', 'title', 'nombre'], 'Producto externo'),
    quantity,
    unit_price: unitPrice,
    line_total: lineTotal
  };
}

function normalizeRow(raw) {
  return normalizeLine(raw, raw);
}

function normalizeCollection(payload) {
  let records;
  if (env.externalApi.recordsPath) {
    const found = getByPath(payload, env.externalApi.recordsPath);
    records = Array.isArray(found) ? found : [];
  } else {
    records = extractArray(payload);
  }

  const itemsPath = env.externalApi.itemsPath;
  const rows = [];
  for (const record of records) {
    const items = itemsPath ? getByPath(record, itemsPath) : null;
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) rows.push(normalizeLine(record, item));
    } else {
      rows.push(normalizeLine(record, record));
    }
  }
  return rows;
}

function isConfigured() {
  return Boolean(env.externalApi.baseUrl);
}

async function fetchExternalSales(filters = {}) {
  if (!isConfigured()) {
    return { configured: false, ok: false, rows: [] };
  }

  try {
    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    const response = await externalApi.request({
      method: 'GET',
      path: env.externalApi.reportsPath,
      params
    });

    const rows = normalizeCollection(response.data);
    return { configured: true, ok: true, rows };
  } catch (err) {
    return { configured: true, ok: false, error: err.message, rows: [] };
  }
}

module.exports = { fetchExternalSales, normalizeRow, normalizeCollection, isConfigured };
