
// import { getDb } from '../db.js';
// import { ObjectId } from 'mongodb';

// // --- Private Function Implementations ---

// async function getOrderStatus(orderId) {
//   if (!ObjectId.isValid(orderId)) {
//     console.warn(`Invalid Order ID format: ${orderId}`);
//     return null;
//   }
//   const db = getDb();
//   const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
//   return order;
// }

// async function searchProducts(query, limit = 3) {
//   const db = getDb();
//   // Ensure text index exists on 'name' and 'tags' fields in MongoDB for $text search
//   const products = await db.collection('products')
//     .find({ $text: { $search: query } })
//     .limit(parseInt(limit, 10))
//     .project({ score: { $meta: "textScore" } }) // Optionally project score
//     .sort({ score: { $meta: "textScore" } })    // Sort by relevance
//     .toArray();
//   return products;
// }

// async function getCustomerOrders(email) {
//   const db = getDb();
//   const customer = await db.collection('customers').findOne({ email });
//   if (!customer) {
//     console.warn(`Customer not found for email: ${email}`);
//     return [];
//   }
//   const orders = await db.collection('orders')
//     .find({ customerId: customer._id })
//     .sort({ createdAt: -1 }) // Sort by most recent first
//     .toArray();
//   return orders;
// }

// // *** NEW FUNCTION ***
// async function countAllProducts() {
//   const db = getDb();
//   const count = await db.collection('products').countDocuments();
//   return { totalProducts: count };
// }


// // --- Registry Storage ---
// const registry = {
//   getOrderStatus: {
//     // Basic schema example (adapt as needed for strict validation)
//     schema: { name: "getOrderStatus", description: "Gets the status and details of a specific order by its ID.", parameters: { type: "object", properties: { orderId: { type: "string", description: "The 24-character hexadecimal order ID." } }, required: ["orderId"] } },
//     execute: ({ orderId }) => getOrderStatus(orderId),
//   },
//   searchProducts: {
//     schema: { name: "searchProducts", description: "Searches the product catalog for items matching a query.", parameters: { type: "object", properties: { query: { type: "string", description: "The search term (e.g., 'red shoes', 'smart watch')." }, limit: { type: "integer", description: "Maximum number of products to return.", default: 3 } }, required: ["query"] } },
//     execute: ({ query, limit }) => searchProducts(query, limit),
//   },
//   getCustomerOrders: {
//     schema: { name: "getCustomerOrders", description: "Gets the order history for a customer based on their email address.", parameters: { type: "object", properties: { email: { type: "string", description: "The customer's email address." } }, required: ["email"] } },
//     execute: ({ email }) => getCustomerOrders(email),
//   },
//   // *** REGISTER NEW FUNCTION ***
//   countAllProducts: {
//      schema: { name: "countAllProducts", description: "Counts the total number of products available in the store catalog.", parameters: { type: "object", properties: {}, required: [] } }, // No parameters needed
//      execute: () => countAllProducts(),
//   }
// };

// // The exported object provides a clean interface for the engine to use.
// export const functionRegistry = {
//   /**
//    * Dynamically registers a new function for the assistant to use.
//    * @param {string} name - The name of the function.
//    * @param {object} schema - The JSON schema defining the function's parameters.
//    * @param {function} execute - The function to execute.
//    */
//   register: (name, schema, execute) => {
//     if (registry[name]) {
//       console.warn(`Warning: Overwriting existing function '${name}' in registry.`);
//     }
//     registry[name] = { schema, execute };
//     console.log(`Function '${name}' registered successfully.`);
//   },

//   /**
//    * Retrieves the JSON schemas for all registered functions. Used for LLM function calling setup if needed.
//    */
//   getAllSchemas: () => {
//     return Object.values(registry).map(item => item.schema);
//   },

//   /**
//    * Executes a function by its name with the provided arguments.
//    * @param {string} name - The name of the function to execute.
//    * @param {object} args - The arguments object for the function.
//    * @returns {Promise<any>} The result of the function execution.
//    */
//   execute: async (name, args = {}) => { // Made async to handle potential errors better
//     if (registry[name]) {
//       try {
//         // Ensure args is always an object, even if empty
//         const validatedArgs = args || {};
//         return await registry[name].execute(validatedArgs);
//       } catch (error) {
//           console.error(`Error executing function '${name}' with args:`, args, error);
//           // Return a structured error or null instead of throwing, depending on desired handling in engine.js
//           return { error: `Failed to execute function ${name}: ${error.message}` };
//       }
//     }
//     console.error(`Error: Function '${name}' is not registered.`);
//     return { error: `Function '${name}' is not registered.` }; // Return error object
//   },
// };


import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

// --- Private Function Implementations ---

async function getOrderStatus(orderId) {
  if (!ObjectId.isValid(orderId)) return { error: "Invalid Order ID format." };
  const db = getDb();
  const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
  return order; // Returns null if not found, handled by engine.js
}

async function searchProducts(query, limit = 3) {
  const db = getDb();
  // Ensure text index exists on 'name', 'description', 'tags' fields in MongoDB
  try {
    const products = await db.collection('products')
      .find({ $text: { $search: query } }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(parseInt(limit, 10))
       // Project only necessary fields to reduce payload size
      .project({ name: 1, price: 1, category: 1, imageUrl: 1, _id: 1 })
      .toArray();
    return products; // Returns empty array if no match
  } catch (error) {
    console.error(`Product search failed for query "${query}":`, error);
    return { error: `Product search failed: ${error.message}` };
  }
}

async function getCustomerOrders(email) {
  const db = getDb();
  const customer = await db.collection('customers').findOne({ email });
  if (!customer) return []; // Empty array if customer not found
  const orders = await db.collection('orders')
    .find({ customerId: customer._id })
    .sort({ createdAt: -1 })
    .toArray();
  return orders;
}

async function countAllProducts() {
  const db = getDb();
  try {
    const count = await db.collection('products').countDocuments();
    return { totalProducts: count };
  } catch (error) {
     console.error("Failed to count products:", error);
     return { error: "Failed to count products." };
  }
}

// *** NEW FUNCTIONS ***

async function getTotalSpendings(email) {
    const db = getDb();
    const customer = await db.collection('customers').findOne({ email });
    if (!customer) return { error: "Customer not found." };

    try {
        const result = await db.collection('orders').aggregate([
            { $match: { customerId: customer._id } },
            { $group: { _id: null, totalSpent: { $sum: "$total" }, orderCount: { $sum: 1 } } }
        ]).toArray();

        if (result.length > 0) {
            return { totalSpent: result[0].totalSpent, orderCount: result[0].orderCount };
        } else {
            return { totalSpent: 0, orderCount: 0 }; // No orders found
        }
    } catch (error) {
        console.error(`Failed to calculate total spendings for ${email}:`, error);
        return { error: "Failed to calculate spendings." };
    }
}

async function getLastOrder(email) {
    const db = getDb();
    const customer = await db.collection('customers').findOne({ email });
    if (!customer) return null; // Or return { error: "Customer not found." }

    try {
        const lastOrder = await db.collection('orders')
            .find({ customerId: customer._id })
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray(); // find returns cursor, toArray gets result

        return lastOrder.length > 0 ? lastOrder[0] : null; // Return the order object or null
    } catch (error) {
        console.error(`Failed to get last order for ${email}:`, error);
        return { error: "Failed to retrieve last order." };
    }
}

async function getProductStockByName(productName) {
    const db = getDb();
    try {
        // Use regex for case-insensitive partial matching
        const product = await db.collection('products').findOne(
            { name: { $regex: productName, $options: 'i' } },
            { projection: { name: 1, stock: 1, _id: 0 } } // Only get name and stock
        );
        return product; // Returns null if not found
    } catch (error) {
        console.error(`Failed to get stock for product "${productName}":`, error);
        return { error: "Failed to retrieve product stock." };
    }
}

async function getAccountDetails(email) {
     const db = getDb();
     try {
         const customer = await db.collection('customers').findOne(
             { email },
             // Exclude sensitive info if necessary, e.g., password hash if you had one
             { projection: { name: 1, email: 1, address: 1, phone: 1, createdAt: 1 } }
         );
         return customer; // Returns null if not found
     } catch (error) {
         console.error(`Failed to get account details for ${email}:`, error);
         return { error: "Failed to retrieve account details." };
     }
}


// --- Registry Storage ---
const registry = {
  // Existing functions...
  getOrderStatus: {
    schema: { name: "getOrderStatus", description: "Gets the status and details of a specific order by its ID.", parameters: { type: "object", properties: { orderId: { type: "string", description: "The 24-character hexadecimal order ID." } }, required: ["orderId"] } },
    execute: ({ orderId }) => getOrderStatus(orderId),
  },
  searchProducts: {
    schema: { name: "searchProducts", description: "Searches the product catalog for items matching a query.", parameters: { type: "object", properties: { query: { type: "string", description: "The search term (e.g., 'red shoes', 'smart watch')." }, limit: { type: "integer", description: "Maximum number of products to return.", default: 3 } }, required: ["query"] } },
    execute: ({ query, limit }) => searchProducts(query, limit),
  },
  getCustomerOrders: {
    schema: { name: "getCustomerOrders", description: "Gets the order history for a customer based on their email address.", parameters: { type: "object", properties: { email: { type: "string", description: "The customer's email address." } }, required: ["email"] } },
    execute: ({ email }) => getCustomerOrders(email),
  },
  countAllProducts: {
     schema: { name: "countAllProducts", description: "Counts the total number of products available in the store catalog.", parameters: { type: "object", properties: {}, required: [] } },
     execute: () => countAllProducts(),
  },
  // *** REGISTER NEW FUNCTIONS ***
  getTotalSpendings: {
      schema: { name: "getTotalSpendings", description: "Calculates the total amount spent and number of orders for a customer.", parameters: { type: "object", properties: { email: { type: "string", description: "The customer's email address." } }, required: ["email"] } },
      execute: ({ email }) => getTotalSpendings(email),
  },
  getLastOrder: {
      schema: { name: "getLastOrder", description: "Retrieves the details of the most recent order placed by a customer.", parameters: { type: "object", properties: { email: { type: "string", description: "The customer's email address." } }, required: ["email"] } },
      execute: ({ email }) => getLastOrder(email),
  },
  getProductStockByName: {
      schema: { name: "getProductStockByName", description: "Checks the current stock level for a specific product by its name.", parameters: { type: "object", properties: { productName: { type: "string", description: "The name (or partial name) of the product." } }, required: ["productName"] } },
      execute: ({ productName }) => getProductStockByName(productName),
  },
   getAccountDetails: {
      schema: { name: "getAccountDetails", description: "Retrieves the account details (name, email, address, phone) for the logged-in customer.", parameters: { type: "object", properties: { email: { type: "string", description: "The customer's email address." } }, required: ["email"] } },
      execute: ({ email }) => getAccountDetails(email),
  },
};

// The exported object provides a clean interface for the engine to use.
export const functionRegistry = {
  // register and getAllSchemas remain the same...
  register: (name, schema, execute) => { /* ... */ },
  getAllSchemas: () => { /* ... */ },

  execute: async (name, args = {}) => {
    if (registry[name]) {
      try {
        const validatedArgs = args || {};
        // console.log(`Executing function: ${name} with args:`, validatedArgs); // Debug log
        const result = await registry[name].execute(validatedArgs);
        // console.log(`Function ${name} result:`, result); // Debug log
        return result;
      } catch (error) {
          console.error(`Error executing function '${name}' with args:`, args, error);
          return { error: `Failed to execute function ${name}: ${error.message}` };
      }
    }
    console.error(`Error: Function '${name}' is not registered.`);
    return { error: `Function '${name}' is not registered.` };
  },
};