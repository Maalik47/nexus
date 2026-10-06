'use strict';

const { pool, withTransaction } = require('../config/db');
const inventoryModel = require('../models/inventoryMovement.model');
const productModel = require('../models/product.model');
const ApiError = require('../utils/ApiError');
const { toCsv } = require('../utils/csv');
const externalReport = require('./externalReport.service');

function buildFilters({ from, to, categoryId, userId } = {}) {
  const conditions = [];
  const params = [];

  if (from) {
    params.push(from);
    conditions.push(`i.issued_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`i.issued_at <= $${params.length}`);
  }
  if (categoryId) {
    params.push(categoryId);
    conditions.push(`p.category_id = $${params.length}`);
  }
  if (userId) {
    params.push(userId);
    conditions.push(`i.user_id = $${params.length}`);
  }

  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

const LINE_FROM = `
  FROM invoice_lines il
  JOIN invoices i ON i.id = il.invoice_id
  JOIN users u ON u.id = i.user_id
  LEFT JOIN products p ON p.id = il.product_id
  LEFT JOIN categories c ON c.id = p.category_id`;

async function salesRows(filters = {}) {
  const { where, params } = buildFilters(filters);
  const { rows } = await pool.query(
    `SELECT i.id AS invoice_id,
            i.issued_at AS date,
            u.name AS user_name,
            COALESCE(c.name, 'Sin categoría') AS category_name,
            il.product_name,
            il.quantity,
            il.unit_price,
            il.line_total
     ${LINE_FROM}
     ${where}
     ORDER BY i.issued_at DESC, i.id DESC`,
    params
  );
  return rows;
}

async function salesSeries({ groupBy = 'day', ...filters } = {}) {
  const group = groupBy === 'month' ? 'month' : 'day';
  const { where, params } = buildFilters(filters);
  const { rows } = await pool.query(
    `SELECT date_trunc('${group}', i.issued_at) AS period,
            SUM(il.line_total)::numeric AS total,
            COUNT(DISTINCT i.id)::int AS orders,
            SUM(il.quantity)::int AS units
     ${LINE_FROM}
     ${where}
     GROUP BY period
     ORDER BY period ASC`,
    params
  );
  return rows;
}

async function topProducts(filters = {}, limit = 5) {
  const { where, params } = buildFilters(filters);
  params.push(limit);
  const { rows } = await pool.query(
    `SELECT il.product_name,
            SUM(il.quantity)::int AS units,
            SUM(il.line_total)::numeric AS total
     ${LINE_FROM}
     ${where}
     GROUP BY il.product_name
     ORDER BY total DESC
     LIMIT $${params.length}`,
    params
  );
  return rows;
}

async function byCategory(filters = {}) {
  const { where, params } = buildFilters(filters);
  const { rows } = await pool.query(
    `SELECT COALESCE(c.name, 'Sin categoría') AS category_name,
            SUM(il.line_total)::numeric AS total,
            SUM(il.quantity)::int AS units
     ${LINE_FROM}
     ${where}
     GROUP BY c.name
     ORDER BY total DESC`,
    params
  );
  return rows;
}

async function summary(filters = {}) {
  const { where, params } = buildFilters(filters);
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(il.line_total), 0)::numeric AS revenue,
            COALESCE(SUM(il.quantity), 0)::int AS units,
            COUNT(DISTINCT i.id)::int AS orders
     ${LINE_FROM}
     ${where}`,
    params
  );
  const base = rows[0];
  const revenue = Number(base.revenue);
  const orders = Number(base.orders);
  const avgTicket = orders > 0 ? Math.round((revenue / orders) * 100) / 100 : 0;

  const [top, categories] = await Promise.all([
    topProducts(filters, 5),
    byCategory(filters)
  ]);

  return {
    revenue,
    units: Number(base.units),
    orders,
    avgTicket,
    topProducts: top,
    byCategory: categories
  };
}

/**
 * Consolidated "informe": tabular + series + summary in a single payload,
 * matching the "generar informes consolidados" use case.
 */
async function consolidated({ groupBy = 'day', ...filters } = {}) {
  const [rows, series, stats] = await Promise.all([
    salesRows(filters),
    salesSeries({ groupBy, ...filters }),
    summary(filters)
  ]);
  return { rows, series, summary: stats };
}

function periodKey(value, groupBy) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (groupBy === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  }
  return date.toISOString().slice(0, 10);
}

function sumRevenue(rows) {
  return rows.reduce((acc, row) => acc + (Number(row.line_total) || 0), 0);
}

/**
 * Merges OUR sales (PostgreSQL) with the data pulled from the external API
 * (another store software). Both sources are normalized to the same row shape
 * and tagged with `source` ("local" | "external") so the reports can display
 * them mixed together while still telling them apart.
 */
async function combinedReport({ groupBy = 'day', ...filters } = {}) {
  const localRows = (await salesRows(filters)).map((row) => ({ ...row, source: 'local' }));
  const external = await externalReport.fetchExternalSales(filters);
  const externalRows = external.rows;

  const rows = [...localRows, ...externalRows].sort(
    (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
  );

  const buckets = new Map();
  for (const row of rows) {
    const key = periodKey(row.date, groupBy);
    if (!key) continue;
    if (!buckets.has(key)) buckets.set(key, { period: key, local: 0, external: 0, total: 0 });
    const point = buckets.get(key);
    const amount = Number(row.line_total) || 0;
    if (row.source === 'external') point.external += amount;
    else point.local += amount;
    point.total += amount;
  }

  const series = [...buckets.values()].sort((a, b) => (a.period < b.period ? -1 : 1));

  return {
    rows,
    series,
    summary: {
      local: { revenue: sumRevenue(localRows), rows: localRows.length },
      external: { revenue: sumRevenue(externalRows), rows: externalRows.length },
      total: { revenue: sumRevenue(rows), rows: rows.length }
    },
    external: {
      configured: external.configured,
      ok: external.ok,
      error: external.error || null,
      count: externalRows.length
    }
  };
}

async function exportDataset({ dataset = 'sales', format = 'json', ...filters } = {}) {
  let rows;
  if (dataset === 'inventory') {
    rows = await inventoryModel.findAll({ limit: 5000 });
  } else {
    rows = (await salesRows(filters)).map((r) => ({
      factura: r.invoice_id,
      fecha: r.date,
      usuario: r.user_name,
      categoria: r.category_name,
      producto: r.product_name,
      cantidad: r.quantity,
      precio_unitario: r.unit_price,
      total_linea: r.line_total
    }));
  }

  if (format === 'csv') {
    return { contentType: 'text/csv', filename: `${dataset}.csv`, body: toCsv(rows) };
  }
  return {
    contentType: 'application/json',
    filename: `${dataset}.json`,
    body: JSON.stringify({ dataset, count: rows.length, generatedAt: new Date().toISOString(), rows }, null, 2)
  };
}

/**
 * Imports inventory movements (CSV/JSON parse is done in the controller).
 * Each row: product_id, movement_type (entrada|salida|ajuste), quantity, reason.
 */
async function importInventory(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw ApiError.badRequest('El archivo de importación no contiene filas');
  }

  return withTransaction(async (client) => {
    const results = [];
    for (const row of rows) {
      const productId = Number(row.product_id ?? row.productId);
      const type = String(row.movement_type ?? row.type ?? 'entrada').toLowerCase();
      const quantity = Number(row.quantity);
      const reason = row.reason || 'Importación';

      if (!Number.isInteger(productId) || !Number.isFinite(quantity) || quantity <= 0) {
        throw ApiError.badRequest('Fila inválida: se requiere product_id y una cantidad positiva', row);
      }
      if (!['entrada', 'salida', 'ajuste'].includes(type)) {
        throw ApiError.badRequest(`Tipo de movimiento inválido "${type}"`, row);
      }

      // eslint-disable-next-line no-await-in-loop
      const product = await productModel.lockForUpdate(client, productId);
      if (!product) throw ApiError.notFound(`Producto ${productId} no encontrado`);

      const delta = type === 'salida' ? -quantity : quantity;
      const newBalance = Math.max(0, Number(product.stock) + delta);
      // eslint-disable-next-line no-await-in-loop
      await client.query('UPDATE products SET stock = $2 WHERE id = $1', [productId, newBalance]);
      // eslint-disable-next-line no-await-in-loop
      const movement = await inventoryModel.create(client, {
        productId,
        type,
        quantity,
        balance: newBalance,
        reason
      });
      results.push(movement);
    }
    return results;
  });
}

module.exports = {
  salesRows,
  salesSeries,
  summary,
  topProducts,
  byCategory,
  consolidated,
  combinedReport,
  exportDataset,
  importInventory
};
