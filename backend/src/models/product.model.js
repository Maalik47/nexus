'use strict';

const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT p.id, p.name, p.description, p.price, p.stock, p.image_url, p.featured,
         p.category_id, c.name AS category_name, p.created_at
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id`;

async function findAll({ categoryId, search, featured, limit = 50, offset = 0 } = {}) {
  const conditions = [];
  const params = [];

  if (categoryId) {
    params.push(categoryId);
    conditions.push(`p.category_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }
  if (featured) {
    conditions.push('p.featured = TRUE');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const { rows } = await pool.query(
    `${BASE_SELECT}
     ${where}
     ORDER BY p.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function countAll({ categoryId, search } = {}) {
  const conditions = [];
  const params = [];
  if (categoryId) {
    params.push(categoryId);
    conditions.push(`category_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`name ILIKE $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM products ${where}`, params);
  return rows[0].total;
}

async function findById(id) {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE p.id = $1 LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO products (name, description, price, stock, image_url, category_id, featured)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      data.name,
      data.description || null,
      data.price,
      data.stock ?? 0,
      data.imageUrl || null,
      data.categoryId || null,
      Boolean(data.featured)
    ]
  );
  return findById(rows[0].id);
}

async function update(id, data) {
  const { rows } = await pool.query(
    `UPDATE products
        SET name = COALESCE($2, name),
            description = COALESCE($3, description),
            price = COALESCE($4, price),
            stock = COALESCE($5, stock),
            image_url = COALESCE($6, image_url),
            category_id = COALESCE($7, category_id),
            featured = COALESCE($8, featured)
      WHERE id = $1
      RETURNING id`,
    [
      id,
      data.name ?? null,
      data.description ?? null,
      data.price ?? null,
      data.stock ?? null,
      data.imageUrl ?? null,
      data.categoryId ?? null,
      data.featured ?? null
    ]
  );
  return rows[0] ? findById(id) : null;
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [id]);
  return rowCount > 0;
}

async function lockForUpdate(client, id) {
  const { rows } = await client.query(
    'SELECT id, name, price, stock FROM products WHERE id = $1 FOR UPDATE',
    [id]
  );
  return rows[0] || null;
}

async function decrementStock(client, id, quantity) {
  const { rows } = await client.query(
    `UPDATE products
        SET stock = stock - $2
      WHERE id = $1
      RETURNING stock`,
    [id, quantity]
  );
  return rows[0] ? rows[0].stock : null;
}

module.exports = {
  findAll,
  countAll,
  findById,
  create,
  update,
  remove,
  lockForUpdate,
  decrementStock
};
