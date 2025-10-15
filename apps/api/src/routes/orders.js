import express from 'express';
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// GET /api/orders?customerId=:customerId - Get all orders for a specific customer
router.get('/', async (req, res) => {
    try {
        const { customerId } = req.query;
        if (!customerId || !ObjectId.isValid(customerId)) {
            return res.status(400).json({ error: "A valid customerId query parameter is required" });
        }

        const db = getDb();
        const orders = await db.collection('orders').find({ customerId: new ObjectId(customerId) }).sort({ createdAt: -1 }).toArray();
        
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders by customerId:", error);
        res.status(500).json({ error: "An internal server error occurred" });
    }
});


// POST /api/orders - Create a new order
router.post('/', async (req, res) => {
  try {
    const { customerId, items, total } = req.body;

    if (!customerId || !items || !total) {
      return res.status(400).json({ error: "Missing required fields: customerId, items, and total are required." });
    }
    if (!ObjectId.isValid(customerId)) {
        return res.status(400).json({ error: "Invalid customerId format." });
    }

    const db = getDb();
    const newOrder = {
      _id: new ObjectId(),
      customerId: new ObjectId(customerId),
      items,
      total,
      status: 'PENDING',
      carrier: null,
      estimatedDelivery: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('orders').insertOne(newOrder);
    const createdOrder = await db.collection('orders').findOne({ _id: result.insertedId });

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// GET /api/orders/:id - Get a single order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order ID format" });
    }

    const db = getDb();
    const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(`Error fetching order with id ${id}:`, error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

export default router;