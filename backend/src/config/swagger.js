'use strict';

/**
 * OpenAPI 3.0 contract. This is what makes the API consumable by ANY external
 * software: the same contract is used by the Swagger UI at /api/docs and can be
 * imported into Postman, code generators, API gateways, etc.
 */
const spec = {
  openapi: '3.0.3',
  info: {
    title: 'NexusGear API',
    version: '1.0.0',
    description:
      'API REST de la tienda NexusGear. Arquitectura cliente-servidor con backend MVC. ' +
      'Todos los endpoints están versionados bajo /api/v1 e intercambian JSON. El software ' +
      'externo puede autenticarse con un JWT de usuario (Bearer) o con una API key ' +
      'servidor-a-servidor (x-api-key).'
  },
  servers: [
    { url: '/api/v1', description: 'Versión 1' }
  ],
  tags: [
    { name: 'Autenticación' },
    { name: 'Productos' },
    { name: 'Categorías' },
    { name: 'Pedidos' },
    { name: 'Inventario' },
    { name: 'Informes' },
    { name: 'Integraciones' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' }
    },
    schemas: {
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          price: { type: 'number' },
          stock: { type: 'integer' },
          image_url: { type: 'string', nullable: true },
          category_id: { type: 'integer', nullable: true },
          category_name: { type: 'string', nullable: true }
        }
      },
      OrderItem: {
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'integer' },
          quantity: { type: 'integer', minimum: 1 }
        }
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Autenticación'],
        summary: 'Registrar un cliente',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Creado' }, 409: { description: 'Correo ya registrado' } }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Autenticarse y obtener un JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string' }, password: { type: 'string' } }
              }
            }
          }
        },
        responses: { 200: { description: 'Correcto' }, 401: { description: 'Credenciales inválidas' } }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Autenticación'],
        summary: 'Principal autenticado actual',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        responses: { 200: { description: 'Correcto' } }
      }
    },
    '/products': {
      get: {
        tags: ['Productos'],
        summary: 'Listar productos',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'categoryId', in: 'query', schema: { type: 'integer' } },
          { name: 'featured', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } }
        ],
        responses: { 200: { description: 'Correcto' } }
      },
      post: {
        tags: ['Productos'],
        summary: 'Crear un producto (admin)',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        responses: { 201: { description: 'Creado' } }
      }
    },
    '/products/{id}': {
      get: {
        tags: ['Productos'],
        summary: 'Obtener un producto',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Correcto' }, 404: { description: 'No encontrado' } }
      },
      put: {
        tags: ['Productos'],
        summary: 'Actualizar un producto (admin)',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Correcto' } }
      },
      delete: {
        tags: ['Productos'],
        summary: 'Eliminar un producto (admin)',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 204: { description: 'Eliminado' } }
      }
    },
    '/categories': {
      get: { tags: ['Categorías'], summary: 'Listar categorías', responses: { 200: { description: 'Correcto' } } },
      post: {
        tags: ['Categorías'],
        summary: 'Crear una categoría (admin)',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        responses: { 201: { description: 'Creado' } }
      }
    },
    '/orders': {
      get: {
        tags: ['Pedidos'],
        summary: 'Listar pedidos (propios para clientes, todos para admin/integraciones)',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        responses: { 200: { description: 'Correcto' } }
      },
      post: {
        tags: ['Pedidos'],
        summary: 'Crear un pedido (POST /pedidos en el diagrama de secuencia)',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: { type: 'integer', description: 'Requerido solo para integraciones con x-api-key' },
                  items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Pedido creado' },
          409: { description: 'Stock insuficiente' }
        }
      }
    },
    '/orders/{id}': {
      get: {
        tags: ['Pedidos'],
        summary: 'Obtener un pedido',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Correcto' }, 404: { description: 'No encontrado' } }
      }
    },
    '/inventory': {
      get: {
        tags: ['Inventario'],
        summary: 'Listar movimientos de inventario (admin)',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        responses: { 200: { description: 'Correcto' } }
      }
    },
    '/inventory/{productId}/movements': {
      get: {
        tags: ['Inventario'],
        summary: 'Movimientos de un producto',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Correcto' } }
      }
    },
    '/inventory/{productId}/adjust': {
      post: {
        tags: ['Inventario'],
        summary: 'Ajustar stock (admin)',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 201: { description: 'Creado' } }
      }
    },
    '/reports/sales': {
      get: {
        tags: ['Informes'],
        summary: 'Informe de ventas tabular',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'categoryId', in: 'query', schema: { type: 'integer' } }
        ],
        responses: { 200: { description: 'Correcto' } }
      }
    },
    '/reports/sales/series': {
      get: {
        tags: ['Informes'],
        summary: 'Serie para gráficos (groupBy=day|month)',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        responses: { 200: { description: 'Correcto' } }
      }
    },
    '/reports/sales/summary': {
      get: {
        tags: ['Informes'],
        summary: 'Resumen consolidado',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        responses: { 200: { description: 'Correcto' } }
      }
    },
    '/reports/sales/consolidated': {
      get: {
        tags: ['Informes'],
        summary: 'Informe consolidado (tabular + serie + resumen)',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        responses: { 200: { description: 'Correcto' } }
      }
    },
    '/reports/combined': {
      get: {
        tags: ['Informes'],
        summary: 'Informe combinado: nuestras ventas + los datos de la API externa',
        description:
          'Combina nuestras propias ventas (PostgreSQL) con las ventas obtenidas de la API ' +
          'externa configurada. Cada fila lleva un campo "source" ("local" o "external"). Si ' +
          'la API externa no está disponible, solo se devuelven nuestros propios datos.',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          { name: 'groupBy', in: 'query', schema: { type: 'string', enum: ['day', 'month'] } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'categoryId', in: 'query', schema: { type: 'integer' } }
        ],
        responses: { 200: { description: 'Correcto' } }
      }
    },
    '/reports/mine': {
      get: {
        tags: ['Informes'],
        summary: 'Informe de las transacciones del usuario autenticado',
        description:
          'Devuelve las ventas (transacciones) del propio usuario autenticado, con filas, ' +
          'serie diaria/mensual y resumen consolidado.',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          { name: 'groupBy', in: 'query', schema: { type: 'string', enum: ['day', 'month'] } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'categoryId', in: 'query', schema: { type: 'integer' } }
        ],
        responses: { 200: { description: 'Correcto' } }
      }
    },
    '/reports/export': {
      get: {
        tags: ['Informes'],
        summary: 'Exportar un conjunto de datos como CSV o JSON',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          { name: 'dataset', in: 'query', schema: { type: 'string', enum: ['sales', 'inventory'] } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['csv', 'json'] } }
        ],
        responses: { 200: { description: 'Archivo' } }
      }
    },
    '/reports/import': {
      post: {
        tags: ['Informes'],
        summary: 'Importar movimientos de inventario desde CSV/JSON (admin)',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [{ name: 'dataset', in: 'query', schema: { type: 'string', enum: ['inventory'] } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' } }
              }
            },
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  rows: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        product_id: { type: 'integer' },
                        movement_type: { type: 'string', enum: ['entrada', 'salida', 'ajuste'] },
                        quantity: { type: 'number' },
                        reason: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Importado' } }
      }
    },
    '/integrations/status': {
      get: {
        tags: ['Integraciones'],
        summary: 'Estado de la integración saliente con la API externa',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        responses: { 200: { description: 'Correcto' } }
      }
    },
    '/integrations/call': {
      post: {
        tags: ['Integraciones'],
        summary: 'Proxy/consumir una API de terceros (admin)',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        responses: { 200: { description: 'Correcto' } }
      }
    }
  }
};

module.exports = spec;
