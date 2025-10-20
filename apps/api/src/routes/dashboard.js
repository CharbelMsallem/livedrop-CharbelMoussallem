// apps/api/src/routes/dashboard.js
import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

// --- Business Metrics Endpoint ---
// GET /api/dashboard/business-metrics
router.get('/business-metrics', async (req, res) => {
  try {
    const db = getDb();
    const ordersCollection = db.collection('orders');

    // 1. Total Revenue, Total Orders, Average Order Value
    const generalStatsPipeline = [
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
        },
      },
    ];

    // 2. Orders by Status
    const statusPipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
            _id: 0,
            status: '$_id',
            count: 1,
        }
      }
    ];

    const [generalStatsResult, statusResult] = await Promise.all([
      ordersCollection.aggregate(generalStatsPipeline).toArray(),
      ordersCollection.aggregate(statusPipeline).toArray(),
    ]);

    const stats = generalStatsResult[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

    res.status(200).json({
      totalRevenue: stats.totalRevenue,
      totalOrders: stats.totalOrders,
      avgOrderValue: stats.avgOrderValue,
      ordersByStatus: statusResult,
    });
  } catch (error) {
    console.error('Error fetching business metrics:', error);
    res.status(500).json({ error: 'Failed to fetch business metrics' });
  }
});


// --- Assistant Analytics Endpoint ---
// GET /api/dashboard/assistant-stats
router.get('/assistant-stats', async (req, res) => {
    try {
        const db = getDb();
        const logsCollection = db.collection('assistant_logs');

        // 1. Intent Distribution
        const intentPipeline = [
            { $group: { _id: '$intent', count: { $sum: 1 } } },
            { $project: { _id: 0, intent: '$_id', count: 1 } },
            { $sort: { count: -1 } }
        ];

        // 2. Function Calls Breakdown
        const functionCallPipeline = [
            { $unwind: '$functionsCalled' },
            { $group: { _id: '$functionsCalled.name', count: { $sum: 1 } } },
            { $project: { _id: 0, functionName: '$_id', count: 1 } },
            { $sort: { count: -1 } }
        ];

        // 3. Average Response Time per Intent
        const timingPipeline = [
            { $group: { _id: '$intent', avgResponseTime: { $avg: '$processingTime' } } },
            { $project: { _id: 0, intent: '$_id', avgResponseTime: 1 } }
        ];

        const [intentDistribution, functionCalls, avgTimings] = await Promise.all([
            logsCollection.aggregate(intentPipeline).toArray(),
            logsCollection.aggregate(functionCallPipeline).toArray(),
            logsCollection.aggregate(timingPipeline).toArray(),
            logsCollection.countDocuments() // Total queries
        ]);

        const totalQueries = await logsCollection.countDocuments();


        res.status(200).json({
            totalQueries,
            intentDistribution,
            functionCalls,
            avgTimings,
        });

    } catch (error) {
        console.error('Error fetching assistant stats:', error);
        res.status(500).json({ error: 'Failed to fetch assistant stats' });
    }
});


// --- System Health & Performance (Mocked/Simple for now) ---
// GET /api/dashboard/performance
router.get('/performance', async (req, res) => {
    // In a real app, this data would come from a monitoring service, logs, or in-memory counters.
    // For this assignment, we will provide some realistic mocked data.
    res.status(200).json({
        avgApiLatency: Math.floor(Math.random() * (80 - 40 + 1)) + 40, // Random ms between 40-80ms
        sseConnections: Math.floor(Math.random() * 10), // Random number of active SSE connections
        failedRequests: Math.floor(Math.random() * 5), // Random small number of failed requests
        dbConnection: "ok", // simple status
        llmService: "ok"
    });
});


export default router;