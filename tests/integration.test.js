// tests/integration.test.js
import { describe, test, expect } from '@jest/globals';

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000/api';

// Helper function to generate unique session IDs
const generateSessionId = () => `integration-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to wait for order status changes in SSE
const waitForOrderStatus = (orderId, targetStatus, timeout = 30000) => {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(`${API_BASE_URL}/orders/status/${orderId}/stream`);
    const timeoutId = setTimeout(() => {
      eventSource.close();
      reject(new Error(`Timeout waiting for status ${targetStatus}`));
    }, timeout);

    eventSource.onmessage = (event) => {
      const order = JSON.parse(event.data);
      if (order.status === targetStatus) {
        clearTimeout(timeoutId);
        eventSource.close();
        resolve(order);
      }
    };

    eventSource.onerror = (error) => {
      clearTimeout(timeoutId);
      eventSource.close();
      reject(error);
    };
  });
};

describe('Integration Tests - End-to-End Workflows', () => {

  // Test 1: Complete Purchase Flow
  describe('Test 1: Complete Purchase Flow', () => {
    let createdOrderId;
    const customerEmail = 'demo@example.com';
    let customerId;

    test('Step 1: Browse products via API', async () => {
      const response = await fetch(`${API_BASE_URL}/products?limit=5`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.products).toBeDefined();
      expect(Array.isArray(data.products)).toBe(true);
      expect(data.products.length).toBeGreaterThan(0);
      expect(data.products[0]).toHaveProperty('_id');
      expect(data.products[0]).toHaveProperty('price');
    }, 20000);

    test('Step 2: Get customer by email', async () => {
      const response = await fetch(`${API_BASE_URL}/customers?email=${customerEmail}`);
      expect(response.status).toBe(200);
      
      const customer = await response.json();
      expect(customer).toHaveProperty('_id');
      expect(customer.email).toBe(customerEmail);
      
      customerId = customer._id;
    }, 20000);

    test('Step 3: Create order', async () => {
      // Get a product first
      const productsResponse = await fetch(`${API_BASE_URL}/products?limit=1`);
      const productsData = await productsResponse.json();
      const product = productsData.products[0];

      const orderData = {
        customerId: customerId,
        items: [{
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1
        }],
        total: product.price
      };

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      expect(response.status).toBe(201);
      const createdOrder = await response.json();
      expect(createdOrder).toHaveProperty('_id');
      expect(createdOrder.status).toBe('PENDING');
      
      createdOrderId = createdOrder._id;
    }, 20000);

    test('Step 4: Verify order was created', async () => {
      expect(createdOrderId).toBeDefined();
      
      const response = await fetch(`${API_BASE_URL}/orders/${createdOrderId}`);
      expect(response.status).toBe(200);
      
      const order = await response.json();
      expect(order._id).toBe(createdOrderId);
      expect(order.customerId).toBe(customerId);
    }, 20000);

    test('Step 5: Ask assistant about order status', async () => {
      const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `What is the status of my order ${createdOrderId}?`,
          userEmail: customerEmail,
          sessionId: generateSessionId()
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.intent).toBe('order_status');
      expect(result.functionsCalled.length).toBeGreaterThan(0);
      expect(result.functionsCalled[0].name).toBe('getOrderStatus');
      expect(result.text).toContain(createdOrderId);
    }, 15000);
  });

  // Test 2: Support Interaction Flow
  describe('Test 2: Support Interaction Flow', () => {
    const sessionId = generateSessionId();
    const customerEmail = 'demo@example.com';

    test('Step 1: Ask policy question', async () => {
      const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'What is your return policy?',
          userEmail: customerEmail,
          sessionId
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.intent).toBe('policy_question');
      expect(result.functionsCalled.length).toBe(0);
      expect(result.citations).toBeDefined();
      expect(result.citations.validCitations.length).toBeGreaterThan(0);
    }, 15000);

    test('Step 2: Ask about specific order', async () => {
      // Get customer's orders first
      const customersResponse = await fetch(`${API_BASE_URL}/customers?email=${customerEmail}`);
      const customer = await customersResponse.json();
      
      const ordersResponse = await fetch(`${API_BASE_URL}/orders?customerId=${customer._id}`);
      const orders = await ordersResponse.json();
      
      expect(orders.length).toBeGreaterThan(0);
      const orderId = orders[0]._id;

      const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Check order ${orderId}`,
          userEmail: customerEmail,
          sessionId
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.intent).toBe('order_status');
      expect(result.functionsCalled.length).toBeGreaterThan(0);
    }, 15000);

    test('Step 3: Express complaint', async () => {
      const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'My order arrived damaged and broken!',
          userEmail: customerEmail,
          sessionId
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.intent).toBe('complaint');
      // Should have empathetic response
      expect(result.text.toLowerCase()).toMatch(/sorry|apologize|help|resolve/);
    }, 15000);
  });

  // Test 3: Multi-Intent Conversation
  describe('Test 3: Multi-Intent Conversation', () => {
    const sessionId = generateSessionId();
    const customerEmail = 'demo@example.com';
    const conversationFlow = [];

    test('Step 1: Start with greeting', async () => {
      const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Hello there!',
          userEmail: customerEmail,
          sessionId
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.intent).toBe('chitchat');
      conversationFlow.push({ query: 'Hello there!', intent: result.intent });
    }, 15000);

    test('Step 2: Ask about products', async () => {
      const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Do you have any headphones?',
          userEmail: customerEmail,
          sessionId
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.intent).toBe('product_search');
      expect(result.functionsCalled.length).toBeGreaterThan(0);
      conversationFlow.push({ query: 'Do you have any headphones?', intent: result.intent });
    }, 15000);

    test('Step 3: Ask about policy', async () => {
      const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'What are your shipping options?',
          userEmail: customerEmail,
          sessionId
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.intent).toBe('policy_question');
      conversationFlow.push({ query: 'What are your shipping options?', intent: result.intent });
    }, 15000);

    test('Step 4: Check order', async () => {
      const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'What was my last order?',
          userEmail: customerEmail,
          sessionId
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.intent).toBe('last_order');
      expect(result.functionsCalled.length).toBeGreaterThan(0);
      conversationFlow.push({ query: 'What was my last order?', intent: result.intent });
    }, 15000);

    test('Step 5: Verify conversation maintained context', () => {
      // Verify we had a multi-turn conversation
      expect(conversationFlow.length).toBe(4);
      
      // Verify different intents were handled
      const intents = conversationFlow.map(turn => turn.intent);
      expect(new Set(intents).size).toBeGreaterThan(1);
      
      // Verify order: chitchat -> product_search -> policy_question -> last_order
      expect(intents).toEqual(['chitchat', 'product_search', 'policy_question', 'last_order']);
    });
  });

  // Test 4: Analytics Dashboard Data Flow
  describe('Test 4: Analytics Dashboard Data Flow', () => {
    test('Step 1: Fetch business metrics', async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard/business-metrics`);
      expect(response.status).toBe(200);
      
      const metrics = await response.json();
      expect(metrics).toHaveProperty('totalRevenue');
      expect(metrics).toHaveProperty('totalOrders');
      expect(metrics).toHaveProperty('avgOrderValue');
      expect(metrics).toHaveProperty('ordersByStatus');
      expect(Array.isArray(metrics.ordersByStatus)).toBe(true);
    }, 20000);

    test('Step 2: Fetch assistant analytics', async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard/assistant-stats`);
      expect(response.status).toBe(200);
      
      const stats = await response.json();
      expect(stats).toHaveProperty('totalQueries');
      expect(stats).toHaveProperty('intentDistribution');
      expect(stats).toHaveProperty('functionCalls');
      expect(Array.isArray(stats.intentDistribution)).toBe(true);
    }, 20000);

    test('Step 3: Fetch performance metrics', async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard/performance`);
      expect(response.status).toBe(200);
      
      const performance = await response.json();
      expect(performance).toHaveProperty('avgApiLatency');
      expect(performance).toHaveProperty('sseConnections');
      expect(performance).toHaveProperty('dbConnection');
      expect(typeof performance.avgApiLatency).toBe('number');
    }, 20000);

    test('Step 4: Fetch daily revenue analytics', async () => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch(`${API_BASE_URL}/analytics/daily-revenue?from=${weekAgo}&to=${today}`);
      expect(response.status).toBe(200);
      
      const dailyRevenue = await response.json();
      expect(Array.isArray(dailyRevenue)).toBe(true);
      
      if (dailyRevenue.length > 0) {
        expect(dailyRevenue[0]).toHaveProperty('date');
        expect(dailyRevenue[0]).toHaveProperty('revenue');
        expect(dailyRevenue[0]).toHaveProperty('orderCount');
      }
    }, 20000);
  });

});