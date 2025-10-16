
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

// --- Private Function Implementations ---
// These are the core functions that interact with the database.

async function getOrderStatus(orderId) {
  if (!ObjectId.isValid(orderId)) {
    console.warn(`Invalid Order ID format: ${orderId}`);
    return null;
  }
  const db = getDb();
  const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
  return order;
}

async function searchProducts(query, limit = 3) {
  const db = getDb();
  const products = await db.collection('products')
    .find({ $text: { $search: query } })
    .limit(parseInt(limit, 10))
    .toArray();
  return products;
}

async function getCustomerOrders(email) {
  const db = getDb();
  const customer = await db.collection('customers').findOne({ email });
  if (!customer) return [];
  
  const orders = await db.collection('orders')
    .find({ customerId: customer._id })
    .sort({ createdAt: -1 })
    .toArray();
  return orders;
}

// --- Registry Storage ---
// An object to hold all registered functions. We initialize it with our core functions.

const registry = {
  getOrderStatus: {
    schema: { /* schema from previous step */ },
    execute: ({ orderId }) => getOrderStatus(orderId),
  },
  searchProducts: {
    schema: { /* schema from previous step */ },
    execute: ({ query, limit }) => searchProducts(query, limit),
  },
  getCustomerOrders: {
    schema: { /* schema from previous step */ },
    execute: ({ email }) => getCustomerOrders(email),
  },
};

// The exported object provides a clean interface for the engine to use.
export const functionRegistry = {
  /**
   * Dynamically registers a new function for the assistant to use.
   * @param {string} name - The name of the function.
   * @param {object} schema - The JSON schema defining the function's parameters.
   * @param {function} execute - The function to execute.
   */
  register: (name, schema, execute) => {
    if (registry[name]) {
      console.warn(`Warning: Overwriting existing function '${name}' in registry.`);
    }
    registry[name] = { schema, execute };
    console.log(`Function '${name}' registered successfully.`);
  },

  /**
   * Retrieves the JSON schemas for all registered functions.
   */
  getAllSchemas: () => {
    return Object.values(registry).map(item => item.schema);
  },
  
  /**
   * Executes a function by its name with the provided arguments.
   */
  execute: (name, args) => {
    if (registry[name]) {
      return registry[name].execute(args);
    }
    throw new Error(`Function '${name}' is not registered.`);
  },
};