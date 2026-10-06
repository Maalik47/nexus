'use strict';

const express = require('express');
const categoryController = require('../controllers/category.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const { validateBody } = require('../middlewares/validate.middleware');

const router = express.Router();

router.get('/', asyncHandler(categoryController.list));

router.post(
  '/',
  authenticate,
  requireRole('admin'),
  validateBody({ name: { required: true, type: 'string', min: 2 } }),
  asyncHandler(categoryController.create)
);

router.put('/:id', authenticate, requireRole('admin'), asyncHandler(categoryController.update));
router.delete('/:id', authenticate, requireRole('admin'), asyncHandler(categoryController.remove));

module.exports = router;
