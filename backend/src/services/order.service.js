'use strict';

const { withTransaction } = require('../config/db');
const productModel = require('../models/product.model');
const invoiceModel = require('../models/invoice.model');
const inventoryModel = require('../models/inventoryMovement.model');
const ApiError = require('../utils/ApiError');

// Tax rate applied on top of the subtotal. Defaults to 0 so totals match the
// catalogue prices (see "Vistas de usuario"). Set TAX_RATE=0.19 for IVA.
const TAX_RATE = Number(process.env.TAX_RATE || 0);

function round(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Creates an order (invoice + lines) and updates inventory atomically.
 * Mirrors the "Realizar pedido" sequence diagram:
 *   POST /pedidos -> crear pedido -> guardar pedido -> pedido creado.
 */
async function createOrder(userId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('El pedido debe contener al menos un producto');
  }

  return withTransaction(async (client) => {
    const lines = [];
    let subtotal = 0;

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);

      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
        throw ApiError.badRequest('Cada ítem requiere un productId válido y una cantidad entera positiva');
      }

      // eslint-disable-next-line no-await-in-loop
      const product = await productModel.lockForUpdate(client, productId);
      if (!product) {
        throw ApiError.notFound(`Producto ${productId} no encontrado`);
      }
      if (product.stock < quantity) {
        throw ApiError.conflict(
          `Stock insuficiente para "${product.name}" (disponible: ${product.stock})`
        );
      }

      const unitPrice = Number(product.price);
      const lineTotal = round(unitPrice * quantity);
      subtotal += lineTotal;

      lines.push({
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice,
        lineTotal
      });
    }

    subtotal = round(subtotal);
    const tax = round(subtotal * TAX_RATE);
    const total = round(subtotal + tax);

    const invoice = await invoiceModel.create(client, {
      userId,
      lines,
      subtotal,
      tax,
      total,
      status: 'pagada'
    });

    for (const line of invoice.lines) {
      // eslint-disable-next-line no-await-in-loop
      const newStock = await productModel.decrementStock(client, line.product_id, line.quantity);
      // eslint-disable-next-line no-await-in-loop
      await inventoryModel.create(client, {
        productId: line.product_id,
        type: 'salida',
        quantity: line.quantity,
        balance: newStock,
        reason: `Venta pedido #${invoice.id}`,
        invoiceId: invoice.id
      });
    }

    return invoice;
  });
}

module.exports = { createOrder, TAX_RATE };
