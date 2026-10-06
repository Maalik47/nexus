'use strict';

const { pool } = require('../config/db');

async function create(client, { userId, lines, subtotal, tax, total, status = 'pagada', notes = null }) {
  const { rows } = await client.query(
    `INSERT INTO invoices (user_id, subtotal, tax, total, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, issued_at, subtotal, tax, total, status, notes`,
    [userId, subtotal, tax, total, status, notes]
  );
  const invoice = rows[0];

  const insertedLines = [];
  for (const line of lines) {
    // eslint-disable-next-line no-await-in-loop
    const { rows: lineRows } = await client.query(
      `INSERT INTO invoice_lines
         (invoice_id, product_id, product_name, quantity, unit_price, line_total)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, invoice_id, product_id, product_name, quantity, unit_price, line_total`,
      [invoice.id, line.productId, line.productName, line.quantity, line.unitPrice, line.lineTotal]
    );
    insertedLines.push(lineRows[0]);
  }

  return { ...invoice, lines: insertedLines };
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT i.id, i.user_id, u.name AS user_name, u.email AS user_email,
            i.issued_at, i.subtotal, i.tax, i.total, i.status, i.notes
       FROM invoices i
       JOIN users u ON u.id = i.user_id
      WHERE i.id = $1`,
    [id]
  );
  if (!rows[0]) return null;

  const invoice = rows[0];
  const { rows: lines } = await pool.query(
    `SELECT id, product_id, product_name, quantity, unit_price, line_total
       FROM invoice_lines
      WHERE invoice_id = $1
      ORDER BY id ASC`,
    [id]
  );
  return { ...invoice, lines };
}

async function findAll({ userId, from, to, limit = 50, offset = 0 } = {}) {
  const conditions = [];
  const params = [];

  if (userId) {
    params.push(userId);
    conditions.push(`i.user_id = $${params.length}`);
  }
  if (from) {
    params.push(from);
    conditions.push(`i.issued_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`i.issued_at <= $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT i.id, i.user_id, u.name AS user_name, i.issued_at,
            i.subtotal, i.tax, i.total, i.status,
            (SELECT COALESCE(SUM(il.quantity), 0)::int FROM invoice_lines il WHERE il.invoice_id = i.id) AS items
       FROM invoices i
       JOIN users u ON u.id = i.user_id
      ${where}
      ORDER BY i.issued_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function countAll({ userId, from, to } = {}) {
  const conditions = [];
  const params = [];
  if (userId) {
    params.push(userId);
    conditions.push(`user_id = $${params.length}`);
  }
  if (from) {
    params.push(from);
    conditions.push(`issued_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`issued_at <= $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM invoices ${where}`, params);
  return rows[0].total;
}

module.exports = { create, findById, findAll, countAll };
