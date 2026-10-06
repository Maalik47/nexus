'use strict';

const express = require('express');
const inventoryController = require('../controllers/inventory.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const { validateBody } = require('../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate, requireRole('admin'));

router.get('/', asyncHandler(inventoryController.list));
router.get('/:productId/movements', asyncHandler(inventoryController.byProduct));
router.post(
  '/:productId/adjust',
  validateBody({
    type: { required: true, enum: ['entrada', 'salida', 'ajuste'] },
    quantity: { required: true, type: 'number', positive: true }
  }),
  asyncHandler(inventoryController.adjust)
);

module.exports = router;
