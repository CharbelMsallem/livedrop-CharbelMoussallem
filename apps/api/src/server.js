// apps/api/src/server.js

import express from 'express';
import cors from 'cors';
import { connectToDb } from './db.js';

// Import routes
import productRoutes from './routes/products.js';
import customerRoutes from './routes/customers.js';
import orderRoutes from './routes/orders.js';
import analyticsRoutes from './routes/analytics.js';
import orderStatusRoutes from './sse/order-status.js'; 
import assistantRoutes from './routes/assistant.js';

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware ---

const allowedOrigins = [
  'http://localhost:5173',
  // Add your deployed frontend URL here
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// --- API Routes ---
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/orders/status', orderStatusRoutes); 
app.use('/api/assistant', assistantRoutes);

// --- Server Startup ---
async function startServer() {
  await connectToDb();
  app.listen(port, () => {
    console.log(`API server is running on http://localhost:${port}`);
  });
}

startServer();