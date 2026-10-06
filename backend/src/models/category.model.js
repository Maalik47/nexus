'use strict';

const { pool } = require('../config/db');

async function findAll() {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.description, COUNT(p.id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC`
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, name, description FROM categories WHERE id = $1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function create({ name, description }) {
  const { rows } = await pool.query(
    `INSERT INTO categories (name, description)
     VALUES ($1, $2)
     RETURNING id, name, description`,
    [name, description || null]
  );
  return rows[0];
}

async function update(id, { name, description }) {
  const { rows } = await pool.query(
    `UPDATE categories
        SET name = COALESCE($2, name),
            description = COALESCE($3, description)
      WHERE id = $1
      RETURNING id, name, description`,
    [id, name ?? null, description ?? null]
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { findAll, findById, create, update, remove };
