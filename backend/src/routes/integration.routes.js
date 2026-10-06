'use strict';

const express = require('express');
const integrationController = require('../controllers/integration.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate, requireRole('admin'));

router.get('/status', asyncHandler(integrationController.status));
router.post('/call', asyncHandler(integrationController.call));

module.exports = router;
