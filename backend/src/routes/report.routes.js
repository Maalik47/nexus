'use strict';

const express = require('express');
const multer = require('multer');
const reportController = require('../controllers/report.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Authenticated user's own sales report (available to any logged-in user).
router.get('/mine', authenticate, asyncHandler(reportController.myReport));

router.use(authenticate, requireRole('admin'));

router.get('/sales', asyncHandler(reportController.salesTabular));
router.get('/sales/series', asyncHandler(reportController.salesSeries));
router.get('/sales/summary', asyncHandler(reportController.summary));
router.get('/sales/consolidated', asyncHandler(reportController.consolidated));
router.get('/combined', asyncHandler(reportController.combined));
router.get('/export', asyncHandler(reportController.exportReport));
router.post('/import', upload.single('file'), asyncHandler(reportController.importReport));

module.exports = router;
