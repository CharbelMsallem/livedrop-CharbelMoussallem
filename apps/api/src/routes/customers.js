import express from 'express';
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// GET /api/customers?email=user@example.com - Look up customer by email
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email query parameter is required" });
    }

    const db = getDb();
    const customer = await db.collection('customers').findOne({ email });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.status(200).json(customer);
  } catch (error) {
    console.error("Error fetching customer by email:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// GET /api/customers/:id - Get customer profile by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid customer ID format" });
    }

    const db = getDb();
    const customer = await db.collection('customers').findOne({ _id: new ObjectId(id) });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.status(200).json(customer);
  } catch (error) {
    console.error(`Error fetching customer with id ${req.params.id}:`, error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

export default router;