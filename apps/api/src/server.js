// apps/api/src/server.js

import express from 'express';
import cors from 'cors';
import { connectToDb } from './db.js';

// Import routes
import productRoutes from './routes/products.js';
import customerRoutes from './routes/customers.js';
import orderRoutes from './routes/orders.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware ---

// This is the crucial part.
// We're creating a list of trusted origins.
const allowedOrigins = [
  'http://localhost:5173', // Your frontend development server
  // Add your deployed frontend URL here when you have it
  // e.g., 'https://your-frontend-app.vercel.app'
];

// Configure CORS to only allow requests from your frontend
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json());

// --- API Routes ---
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);

// --- Server Startup ---
async function startServer() {
  await connectToDb();
  app.listen(port, () => {
    console.log(`API server is running on http://localhost:${port}`);
  });
}

startServer();