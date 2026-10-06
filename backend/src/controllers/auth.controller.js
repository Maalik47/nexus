'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/user.model');
const ApiError = require('../utils/ApiError');

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

async function register(req, res) {
  const { name, email, password } = req.body;

  const existing = await userModel.findByEmail(email);
  if (existing) throw ApiError.conflict('El correo ya está registrado');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userModel.create({ name, email, passwordHash, role: 'cliente' });
  const token = signToken(user);

  res.status(201).json({ success: true, data: { user, token } });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findByEmail(email, { includeHash: true });
  if (!user) throw ApiError.unauthorized('Credenciales inválidas');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw ApiError.unauthorized('Credenciales inválidas');

  delete user.password_hash;
  const token = signToken(user);
  res.json({ success: true, data: { user, token } });
}

async function me(req, res) {
  if (req.integration) {
    return res.json({ success: true, data: { actor: 'external-api', via: 'api-key' } });
  }
  const user = await userModel.findById(req.user.id);
  if (!user) throw ApiError.notFound('Usuario no encontrado');
  return res.json({ success: true, data: { user } });
}

module.exports = { register, login, me };
