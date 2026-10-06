'use strict';

const { pool } = require('../config/db');

const PUBLIC_COLUMNS = 'id, name, email, role, created_at';

async function findByEmail(email, { includeHash = false } = {}) {
  const columns = includeHash ? `${PUBLIC_COLUMNS}, password_hash` : PUBLIC_COLUMNS;
  const { rows } = await pool.query(
    `SELECT ${columns} FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function create({ name, email, passwordHash, role = 'cliente' }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, LOWER($2), $3, $4)
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, passwordHash, role]
  );
  return rows[0];
}

module.exports = { findByEmail, findById, create };
