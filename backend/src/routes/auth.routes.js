'use strict';

const express = require('express');
const authController = require('../controllers/auth.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateBody } = require('../middlewares/validate.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  validateBody({
    name: { required: true, type: 'string', min: 2 },
    email: { required: true, type: 'string', email: true },
    password: { required: true, type: 'string', min: 8 }
  }),
  asyncHandler(authController.register)
);

router.post(
  '/login',
  authLimiter,
  validateBody({
    email: { required: true, type: 'string', email: true },
    password: { required: true, type: 'string' }
  }),
  asyncHandler(authController.login)
);

router.get('/me', authenticate, asyncHandler(authController.me));

module.exports = router;
