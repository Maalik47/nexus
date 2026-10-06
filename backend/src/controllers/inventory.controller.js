'use strict';

const inventoryModel = require('../models/inventoryMovement.model');
const productModel = require('../models/product.model');
const ApiError = require('../utils/ApiError');
const { withTransaction } = require('../config/db');

async function list(req, res) {
  const limit = Math.min(500, Math.max(1, Number(req.query.limit || 100)));
  const offset = Math.max(0, Number(req.query.offset || 0));
  const movements = await inventoryModel.findAll({ limit, offset });
  res.json({ success: true, data: movements, meta: { limit, offset } });
}

async function byProduct(req, res) {
  const productId = Number(req.params.productId);
  const product = await productModel.findById(productId);
  if (!product) throw ApiError.notFound('Producto no encontrado');
  const movements = await inventoryModel.findByProduct(productId, {
    limit: Math.min(500, Number(req.query.limit || 100))
  });
  res.json({ success: true, data: movements });
}

async function adjust(req, res) {
  const productId = Number(req.params.productId);
  const { type, quantity, reason } = req.body;
  if (!['entrada', 'salida', 'ajuste'].includes(type)) {
    throw ApiError.badRequest('type debe ser uno de: entrada, salida, ajuste');
  }
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw ApiError.badRequest('quantity debe ser un número positivo');
  }

  const result = await withTransaction(async (client) => {
    const product = await productModel.lockForUpdate(client, productId);
    if (!product) throw ApiError.notFound('Producto no encontrado');

    const delta = type === 'salida' ? -qty : qty;
    const newBalance = Math.max(0, Number(product.stock) + delta);
    await client.query('UPDATE products SET stock = $2 WHERE id = $1', [productId, newBalance]);
    return inventoryModel.create(client, {
      productId,
      type,
      quantity: qty,
      balance: newBalance,
      reason: reason || 'Ajuste manual'
    });
  });

  res.status(201).json({ success: true, data: result });
}

module.exports = { list, byProduct, adjust };
