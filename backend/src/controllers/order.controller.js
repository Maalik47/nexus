'use strict';

const orderService = require('../services/order.service');
const invoiceModel = require('../models/invoice.model');
const ApiError = require('../utils/ApiError');

async function create(req, res) {
  if (req.integration) {
    // External software must identify the customer it is ordering for.
    if (!req.body.userId) {
      throw ApiError.badRequest('Las integraciones externas deben proporcionar "userId"');
    }
  }
  const userId = req.integration ? Number(req.body.userId) : req.user.id;
  const invoice = await orderService.createOrder(userId, req.body.items);
  res.status(201).json({ success: true, data: invoice });
}

async function list(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const filters = {
    from: req.query.from || undefined,
    to: req.query.to || undefined,
    limit,
    offset: (page - 1) * limit
  };
  // Clients can only see their own orders; admins and integrations see all.
  if (!req.integration && req.user.role !== 'admin') {
    filters.userId = req.user.id;
  }

  const [items, total] = await Promise.all([
    invoiceModel.findAll(filters),
    invoiceModel.countAll(filters)
  ]);

  res.json({ success: true, data: items, meta: { page, limit, total } });
}

async function get(req, res) {
  const invoice = await invoiceModel.findById(Number(req.params.id));
  if (!invoice) throw ApiError.notFound('Pedido no encontrado');
  if (!req.integration && req.user.role !== 'admin' && invoice.user_id !== req.user.id) {
    throw ApiError.forbidden('No puedes acceder a este pedido');
  }
  res.json({ success: true, data: invoice });
}

module.exports = { create, list, get };
