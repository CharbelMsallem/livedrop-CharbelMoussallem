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
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const port = process.env.PORT || 3000;

// --- Basic Performance Tracking Variables ---
let requestCount = 0;
let totalLatency = 0;
let failedRequestCount = 0;

export const getPerformanceStats = () => ({
    avgApiLatency: requestCount > 0 ? Math.round(totalLatency / requestCount) : 0,
    failedRequests: failedRequestCount,
});
export const resetFailedRequestCounter = () => { failedRequestCount = 0; } // Reset periodically

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

// --- Latency Tracking Middleware ---
app.use((req, res, next) => {
    // Exclude SSE stream and dashboard routes from latency calculation
    if (req.path.includes('/stream') || req.path.includes('/dashboard')) {
        return next();
    }
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        requestCount++;
        totalLatency += duration;
        // Basic log - more sophisticated logging recommended in production
        // console.log(`Request to ${req.path} took ${duration}ms`);
    });
    next();
});


// --- API Routes ---
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/orders/status', orderStatusRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- Basic Error Handling Middleware ---
// IMPORTANT: This should be placed *after* all your routes
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.stack);
    failedRequestCount++; // Increment failure count
    // Avoid sending SSE stream errors here
    if (!res.headersSent) {
       res.status(err.status || 500).json({
         error: err.message || 'An unexpected internal server error occurred.'
       });
    }
});


// --- Server Startup ---
async function startServer() {
  await connectToDb();
  app.listen(port, () => {
    console.log(`API server is running on http://localhost:${port}`);
  });
}

startServer();