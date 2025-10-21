// tests/api.test.js

// Mock fetch or use a library like 'supertest' if testing locally
// For this example, we'll assume a running API endpoint (replace with your actual deployed API URL)
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000/api'; // Use environment variable or default

describe('API Endpoint Tests', () => {

  // Test GET /api/products
  test('GET /api/products should return an array of products', async () => {
    const response = await fetch(`${API_BASE_URL}/products?limit=5`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('products');
    expect(Array.isArray(data.products)).toBe(true);
    expect(data.products.length).toBeLessThanOrEqual(5);
    if (data.products.length > 0) {
      expect(data.products[0]).toHaveProperty('_id');
      expect(data.products[0]).toHaveProperty('name');
      expect(data.products[0]).toHaveProperty('price');
    }
  });

  // Test POST /api/orders (Valid Data)
  test('POST /api/orders with valid data should create an order', async () => {
    // Note: You need a valid customerId and product details from your seeded data
    const mockOrderData = {
      customerId: 'your_seeded_customer_id', // Replace with a real ID from your DB
      items: [{
        productId: 'your_seeded_product_id', // Replace with real ID
        name: 'Test Product',
        price: 10.99,
        quantity: 1
       }],
      total: 10.99,
    };

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockOrderData),
    });

    expect(response.status).toBe(201); // 201 Created
    const data = await response.json();
    expect(data).toHaveProperty('_id');
    expect(data.customerId).toBe(mockOrderData.customerId);
    expect(data.status).toBe('PENDING');
  });

  // Test POST /api/orders (Invalid Data)
  test('POST /api/orders with invalid data should return 400', async () => {
    const invalidOrderData = {
      // Missing customerId, items, total
    };

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidOrderData),
    });

    expect(response.status).toBe(400); // Bad Request
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

   // Test GET /api/analytics/daily-revenue
  test('GET /api/analytics/daily-revenue should return array with date, revenue, orderCount', async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_BASE_URL}/analytics/daily-revenue?from=${today}&to=${today}`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    // If there's data for today, check its structure
    if (data.length > 0) {
        expect(data[0]).toHaveProperty('date');
        expect(data[0]).toHaveProperty('revenue');
        expect(data[0]).toHaveProperty('orderCount');
    }
  });

  // Test Error Response Format
  test('GET /api/products/invalid_id should return 404 with JSON error', async () => {
    const response = await fetch(`${API_BASE_URL}/products/invalid_id`);
    expect(response.status).toBe(404); // Not Found (assuming non-ObjectId format causes error or not found)
    const data = await response.json();
    expect(data).toHaveProperty('error');
    // Depending on your specific implementation, it might be 400 or 500
    // Adjust the expected status code based on your API's behavior for invalid IDs
  });

});