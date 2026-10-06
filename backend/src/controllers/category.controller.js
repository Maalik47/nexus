'use strict';

const categoryModel = require('../models/category.model');
const ApiError = require('../utils/ApiError');

async function list(req, res) {
  const categories = await categoryModel.findAll();
  res.json({ success: true, data: categories });
}

async function create(req, res) {
  const category = await categoryModel.create(req.body);
  res.status(201).json({ success: true, data: category });
}

async function update(req, res) {
  const category = await categoryModel.update(Number(req.params.id), req.body);
  if (!category) throw ApiError.notFound('Categoría no encontrada');
  res.json({ success: true, data: category });
}

async function remove(req, res) {
  const deleted = await categoryModel.remove(Number(req.params.id));
  if (!deleted) throw ApiError.notFound('Categoría no encontrada');
  res.status(204).send();
}

module.exports = { list, create, update, remove };
