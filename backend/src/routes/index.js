'use strict';

const express = require('express');

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const orderRoutes = require('./order.routes');
const inventoryRoutes = require('./inventory.routes');
const reportRoutes = require('./report.routes');
const integrationRoutes = require('./integration.routes');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'NexusGear API',
      version: 'v1',
      documentation: '/api/docs',
      endpoints: [
        '/api/v1/auth',
        '/api/v1/products',
        '/api/v1/categories',
        '/api/v1/orders',
        '/api/v1/inventory',
        '/api/v1/reports',
        '/api/v1/integrations'
      ]
    }
  });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reports', reportRoutes);
router.use('/integrations', integrationRoutes);

module.exports = router;
