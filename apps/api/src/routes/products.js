import express from 'express';
import { getDb } from '../db.js';
import { ObjectId } from 'mongodb'; // Import ObjectId for the new POST route

const router = express.Router();

// GET /api/products - Get all products with filtering/sorting
router.get('/', async (req, res) => {
  // ... (existing GET all products code remains unchanged)
  try {
    const db = getDb();
    const { search, tag, sort } = req.query;

    let query = {};
    if (search) {
      query.$text = { $search: search };
    }
    if (tag) {
      query.tags = tag;
    }

    let sortOption = {};
    if (sort === 'price-asc') {
      sortOption.price = 1;
    } else if (sort === 'price-desc') {
      sortOption.price = -1;
    } else {
      sortOption.name = 1;
    }

    const products = await db.collection('products')
      .find(query)
      .sort(sortOption)
      .toArray();

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// GET /api/products/:id - Get a single product
router.get('/:id', async (req, res) => {
  // ... (existing GET single product code remains unchanged)
  try {
    const db = getDb();
    const { id } = req.params;

    const product = await db.collection('products').findOne({ _id: id });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error(`Error fetching product with id ${req.params.id}:`, error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// POST /api/products - Create a new product
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { name, description, price, category, tags, imageUrl, stock } = req.body;

    // Basic validation
    if (!name || !price || !category) {
      return res.status(400).json({ error: "Missing required fields: name, price, and category are required." });
    }

    const newProduct = {
      _id: new ObjectId(), // Generate a new unique MongoDB ID
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      tags: tags || [],
      imageUrl: imageUrl || '',
      stock: parseInt(stock, 10) || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('products').insertOne(newProduct);
    
    // Fetch the newly created document to return it in the response
    const createdProduct = await db.collection('products').findOne({ _id: result.insertedId });

    res.status(201).json(createdProduct); // 201 Created
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

export default router;