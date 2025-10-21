// apps/api/src/assistant/function-registry.js
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

// Create text index on products collection for better search
// Run this once: db.products.createIndex({ name: "text", description: "text", tags: "text" })

async function getOrder(orderId) {
  if (!ObjectId.isValid(orderId)) {
      console.warn(`[Function] Invalid order ID: ${orderId}`);
      return null;
  }
  
  const db = getDb();
  return await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
}

async function searchProductsByName(query, limit = 3) {
  const db = getDb();
  
  // Normalize search term - remove common words
  const normalized = query.toLowerCase()
    .replace(/\b(any|some|the|a|an)\b/g, '')
    .trim();
  
  // Try text search first (requires text index)
  let products = await db.collection('products')
    .find(
      { $text: { $search: normalized } },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .toArray();

  // Fallback to regex if no text search results
  if (products.length === 0) {
    products = await db.collection('products')
      .find({ 
        $or: [
          { name: { $regex: normalized, $options: 'i' } },
          { tags: { $regex: normalized, $options: 'i' } }
        ]
      })
      .limit(limit)
      .toArray();
  }

  return products;
}

async function getOrdersByCustomerId(customerId, limit = 1) {
    if (!ObjectId.isValid(customerId)) {
      console.warn(`[Function] Invalid customer ID: ${customerId}`);
      return [];
  }
  
  const db = getDb();
  return await db.collection('orders')
    .find({ customerId: new ObjectId(customerId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

async function countCustomerOrders(customerId) {
    if (!ObjectId.isValid(customerId)) {
        console.warn(`[Function] Invalid customer ID for count: ${customerId}`);
        return 0;
    }
    
    const db = getDb();
    return await db.collection('orders').countDocuments({ customerId: new ObjectId(customerId) });
}

async function countAllProducts() {
    const db = getDb();
    return await db.collection('products').countDocuments();
}

async function calculateTotalSpending(customerId) {
   if (!ObjectId.isValid(customerId)) {
      console.warn(`[Function] Invalid customer ID: ${customerId}`);
      return { totalSpent: 0, orderCount: 0 };
   }
   
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
      description: 'Retrieves order status and details',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Order ID' },
        },
        required: ['orderId'],
      },
    },
    execute: async ({ orderId }) => await getOrder(orderId),
  },
  
  searchProducts: {
     schema: {
       name: 'searchProducts',
       description: 'Searches products by name or tags',
       parameters: {
         type: 'object',
         properties: {
           query: { type: 'string', description: 'Search term' },
           limit: { type: 'number', description: 'Max results', default: 3 },
         },
         required: ['query'],
       },
     },
     execute: async ({ query, limit }) => await searchProductsByName(query, limit),
   },
   
  getCustomerOrders: {
    schema: {
      name: 'getCustomerOrders',
      description: "Gets customer's order history",
      parameters: {
        type: 'object',
        properties: {
          customerId: { type: 'string', description: "Customer ID" },
          limit: { type: 'number', description: 'Max orders', default: 1 },
        },
        required: ['customerId'],
      },
    },
    execute: async ({ customerId, limit }) => await getOrdersByCustomerId(customerId, limit),
  },
  
   getProductCount: {
     schema: {
       name: 'getProductCount',
       description: 'Counts total products in store',
       parameters: { type: 'object', properties: {} },
     },
     execute: async () => await countAllProducts(),
   },
   
    getTotalSpendings: {
      schema: {
        name: 'getTotalSpendings',
        description: 'Calculates customer total spending',
        parameters: {
          type: 'object',
          properties: {
            customerId: { type: 'string', description: "Customer ID" },
          },
          required: ['customerId'],
        },
      },
      execute: async ({ customerId }) => await calculateTotalSpending(customerId),
   },
   
   countCustomerOrders: {
       schema: {
           name: 'countCustomerOrders',
           description: "Counts customer's total orders",
           parameters: {
               type: 'object',
               properties: {
                   customerId: { type: 'string', description: "Customer ID" },
               },
               required: ['customerId'],
           },
       },
       execute: async ({ customerId }) => ({ orderCount: await countCustomerOrders(customerId) }),
   }
};

export const functionRegistry = {
  execute: async (name, args) => {
    if (!functions[name]) {
      throw new Error(`Function "${name}" not found.`);
    }
    
    try {
        const result = await functions[name].execute(args);
        return result;
    } catch(error) {
        console.error(`[Function] Error executing ${name}:`, error.message);
        throw new Error(`Execution failed for ${name}: ${error.message}`);
    }
  },
  
  getAllSchemas: () => {
    return Object.values(functions).map(f => f.schema);
  }
};