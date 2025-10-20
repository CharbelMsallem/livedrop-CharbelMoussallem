// apps/api/src/assistant/function-registry.js
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

async function getOrder(orderId) {
  if (!ObjectId.isValid(orderId)) {
      console.warn(`[Function Registry] Invalid order ID format: ${orderId}`);
      return null;
  }
  console.log(`[Function Registry] Fetching order ${orderId}...`);
  const db = getDb();
  return await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
}

async function searchProductsByName(query, limit = 3) {
  console.log(`[Function Registry] Searching products for "${query}" (limit ${limit})...`);
  const db = getDb();
  return await db.collection('products')
    .find({ name: { $regex: query, $options: 'i' } })
    .limit(limit)
    .toArray();
}

async function getOrdersByCustomerId(customerId, limit = 1) {
    if (!ObjectId.isValid(customerId)) {
      console.warn(`[Function Registry] Invalid customer ID format: ${customerId}`);
      return [];
  }
  console.log(`[Function Registry] Fetching orders for customer ${customerId} (limit ${limit})...`);
  const db = getDb();
  return await db.collection('orders')
    .find({ customerId: new ObjectId(customerId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

async function countCustomerOrders(customerId) {
    if (!ObjectId.isValid(customerId)) {
        console.warn(`[Function Registry] Invalid customer ID format for count: ${customerId}`);
        return 0;
    }
    console.log(`[Function Registry] Counting orders for customer ${customerId}...`);
    const db = getDb();
    return await db.collection('orders').countDocuments({ customerId: new ObjectId(customerId) });
}

async function countAllProducts() {
    console.log(`[Function Registry] Counting all products...`);
    const db = getDb();
    return await db.collection('products').countDocuments();
}

async function calculateTotalSpending(customerId) {
   if (!ObjectId.isValid(customerId)) {
      console.warn(`[Function Registry] Invalid customer ID format: ${customerId}`);
      return { totalSpent: 0, orderCount: 0 };
   }
   console.log(`[Function Registry] Calculating total spending for customer ${customerId}...`);
   const db = getDb();
   const result = await db.collection('orders').aggregate([
     { $match: { customerId: new ObjectId(customerId) } },
     { $group: { _id: null, totalSpent: { $sum: "$total" }, orderCount: { $sum: 1 } } }
   ]).toArray();

   return result[0] || { totalSpent: 0, orderCount: 0 };
}

const functions = {
  getOrderStatus: {
    schema: {
      name: 'getOrderStatus',
      description: 'Retrieves the current status and details of a specific Shoplite order.',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'The unique ID of the order.' },
        },
        required: ['orderId'],
      },
    },
    execute: async ({ orderId }) => await getOrder(orderId),
  },
  searchProducts: {
     schema: {
       name: 'searchProducts',
       description: 'Searches the Shoplite product catalog based on a query string.',
       parameters: {
         type: 'object',
         properties: {
           query: { type: 'string', description: 'The search term for products (e.g., "smart watch", "headphones").' },
           limit: { type: 'number', description: 'Maximum number of products to return (default: 3).', default: 3 },
         },
         required: ['query'],
       },
     },
     execute: async ({ query, limit }) => await searchProductsByName(query, limit),
   },
  getCustomerOrders: {
    schema: {
      name: 'getCustomerOrders',
      description: "Retrieves a customer's order history, usually the most recent one.",
      parameters: {
        type: 'object',
        properties: {
          customerId: { type: 'string', description: "The customer's unique ID." },
           limit: { type: 'number', description: 'Maximum number of orders to return (default: 1).', default: 1 },
        },
        required: ['customerId'],
      },
    },
    execute: async ({ customerId, limit }) => await getOrdersByCustomerId(customerId, limit),
  },
   getProductCount: {
     schema: {
       name: 'getProductCount',
       description: 'Counts the total number of products available in the Shoplite store.',
       parameters: { type: 'object', properties: {} },
     },
     execute: async () => await countAllProducts(),
   },
    getTotalSpendings: {
      schema: {
        name: 'getTotalSpendings',
        description: 'Calculates the total amount a customer has spent and the number of orders they placed.',
        parameters: {
          type: 'object',
          properties: {
            customerId: { type: 'string', description: "The customer's unique ID." },
          },
          required: ['customerId'],
        },
      },
      execute: async ({ customerId }) => await calculateTotalSpending(customerId),
   },
   countCustomerOrders: {
       schema: {
           name: 'countCustomerOrders',
           description: "Counts the total number of orders a customer has placed.",
           parameters: {
               type: 'object',
               properties: {
                   customerId: { type: 'string', description: "The customer's unique ID." },
               },
               required: ['customerId'],
           },
       },
       execute: async ({ customerId }) => ({ orderCount: await countCustomerOrders(customerId) }), // Return as an object
   }
};

export const functionRegistry = {
  execute: async (name, args) => {
    if (!functions[name]) {
      throw new Error(`Function "${name}" not found.`);
    }
    try {
        console.log(`[Function Registry] Executing function "${name}" with args:`, args);
        const result = await functions[name].execute(args);
        console.log(`[Function Registry] Function "${name}" executed successfully.`);
        return result;
    } catch(error) {
        console.error(`[Function Registry] Error executing function "${name}":`, error);
        throw new Error(`Execution failed for function ${name}: ${error.message}`);
    }
  },
};