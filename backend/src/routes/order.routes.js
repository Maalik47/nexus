'use strict';

const express = require('express');
const orderController = require('../controllers/order.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateBody } = require('../middlewares/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(orderController.list));
router.post(
  '/',
  validateBody({ items: { required: true, type: 'array' } }),
  asyncHandler(orderController.create)
);
router.get('/:id', asyncHandler(orderController.get));

module.exports = router;
