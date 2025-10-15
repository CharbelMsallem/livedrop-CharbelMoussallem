// apps/api/src/routes/customers.js

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
    // No change needed here, findOne is correct
    const customer = await db.collection('customers').findOne({ email }); 

    if (!customer) {
      // It's better to return an empty array or a specific not-found response
      // For this logic, the frontend handles null, so 404 is correct.
      return res.status(404).json({ error: "Customer not found" });
    }

    // The KEY FIX: Send the customer object directly, NOT in an array.
    // The previous frontend code was expecting data[0], which works for arrays.
    // The most recent api.ts expects a single object, so we send that.
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