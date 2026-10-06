'use strict';

const { pool } = require('../config/db');

async function create(client, { productId, type, quantity, balance, reason = null, invoiceId = null }) {
  const { rows } = await client.query(
    `INSERT INTO inventory_movements
       (product_id, movement_type, quantity, balance, reason, invoice_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, product_id, movement_type, quantity, balance, reason, invoice_id, created_at`,
    [productId, type, quantity, balance, reason, invoiceId]
  );
  return rows[0];
}

async function findByProduct(productId, { limit = 100 } = {}) {
  const { rows } = await pool.query(
    `SELECT id, product_id, movement_type, quantity, balance, reason, invoice_id, created_at
       FROM inventory_movements
      WHERE product_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
    [productId, limit]
  );
  return rows;
}

async function findAll({ limit = 100, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT m.id, m.product_id, p.name AS product_name, m.movement_type,
            m.quantity, m.balance, m.reason, m.invoice_id, m.created_at
       FROM inventory_movements m
       JOIN products p ON p.id = m.product_id
      ORDER BY m.created_at DESC
      LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

module.exports = { create, findByProduct, findAll };
