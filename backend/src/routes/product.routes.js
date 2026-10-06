'use strict';

const express = require('express');
const productController = require('../controllers/product.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const { validateBody } = require('../middlewares/validate.middleware');

const router = express.Router();

router.get('/', asyncHandler(productController.list));
router.get('/:id', asyncHandler(productController.get));

router.post(
  '/',
  authenticate,
  requireRole('admin'),
  validateBody({
    name: { required: true, type: 'string', min: 2 },
    price: { required: true, type: 'number', positive: true },
    stock: { type: 'number' }
  }),
  asyncHandler(productController.create)
);

router.put('/:id', authenticate, requireRole('admin'), asyncHandler(productController.update));
router.delete('/:id', authenticate, requireRole('admin'), asyncHandler(productController.remove));

module.exports = router;
