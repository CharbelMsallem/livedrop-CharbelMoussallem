import express from 'express';
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// GET /api/analytics/daily-revenue
// Calculates daily revenue and order count within a date range using MongoDB aggregation
router.get('/daily-revenue', async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: "Date range parameters 'from' and 'to' are required." });
    }

    const db = getDb();
    const startDate = new Date(from);
    const endDate = new Date(to);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format. Please use YYYY-MM-DD." });
    }
    
    // Ensure the end date is inclusive of the entire day
    endDate.setUTCHours(23, 59, 59, 999);

    const aggregationPipeline = [
      // 1. Match documents within the date range
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      // 2. Group by date to calculate daily totals
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orderCount: { $sum: 1 },
        },
      },
      // 3. Sort the results by date
      {
        $sort: {
          _id: 1, // Sort by date ascending
        },
      },
      // 4. Rename _id field to be more descriptive
      {
        $project: {
          _id: 0, // Exclude the default _id field
          date: "$_id",
          revenue: "$revenue",
          orderCount: "$orderCount",
        },
      },
    ];

    const dailyRevenue = await db.collection('orders').aggregate(aggregationPipeline).toArray();

    res.status(200).json(dailyRevenue);
  } catch (error) {
    console.error("Error fetching daily revenue analytics:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});


// Note: The other analytics endpoints for the dashboard will be added later
// when we build the dashboard part of the assignment.

export default router;