'use strict';

const productModel = require('../models/product.model');
const categoryModel = require('../models/category.model');
const ApiError = require('../utils/ApiError');

async function list(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
  const filters = {
    categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
    search: req.query.search || undefined,
    featured: req.query.featured === 'true',
    limit,
    offset: (page - 1) * limit
  };

  const [items, total] = await Promise.all([
    productModel.findAll(filters),
    productModel.countAll(filters)
  ]);

  res.json({
    success: true,
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  });
}

async function get(req, res) {
  const product = await productModel.findById(Number(req.params.id));
  if (!product) throw ApiError.notFound('Producto no encontrado');
  res.json({ success: true, data: product });
}

async function create(req, res) {
  const body = req.body;
  if (body.categoryId) {
    const category = await categoryModel.findById(Number(body.categoryId));
    if (!category) throw ApiError.badRequest('La categoría no existe');
  }
  const product = await productModel.create(body);
  res.status(201).json({ success: true, data: product });
}

async function update(req, res) {
  const product = await productModel.update(Number(req.params.id), req.body);
  if (!product) throw ApiError.notFound('Producto no encontrado');
  res.json({ success: true, data: product });
}

async function remove(req, res) {
  const deleted = await productModel.remove(Number(req.params.id));
  if (!deleted) throw ApiError.notFound('Producto no encontrado');
  res.status(204).send();
}

module.exports = { list, get, create, update, remove };
