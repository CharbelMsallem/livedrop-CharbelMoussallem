
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';


export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  imageUrl: string;
  stock: number;
}

export interface Order {
  _id: string;
  customerId: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  carrier?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
  items: {
      imageUrl: string | undefined; productId: string, name: string, price: number, quantity: number 
}[];
  total: number;
}

export interface Customer {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface BusinessMetrics {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    ordersByStatus: { status: string; count: number }[];
}

export interface AssistantStats {
    totalQueries: number;
    intentDistribution: { intent: string; count: number }[];
    functionCalls: { functionName: string; count: number }[];
    avgTimings: { intent: string; avgResponseTime: number }[];
}

export interface PerformanceMetrics {
    avgApiLatency: number;
    sseConnections: number;
    failedRequests: number;
    dbConnection: string;
    llmService: string;
}

export interface DailyRevenue {
    date: string;
    revenue: number;
    orderCount: number;
}

/**
 * Fetches all products from the backend.
 * This function is now guaranteed to always return an array.
 */
export async function listProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products?limit=50`);
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return []; // Return empty array on error
    }
    const data = await response.json();
    // Safely access the 'products' property. If it doesn't exist, default to an empty array.
    return data.products || [];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return []; // Return empty array on any failure
  }
}

// Fetches a single product by its ID from the backend
export async function getProduct(id: string): Promise<Product | null> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch product');
  }
  return response.json();
}


// Fetches a customer by email
export async function getCustomerByEmail(email: string): Promise<Customer | null> {
    const response = await fetch(`${API_BASE_URL}/customers?email=${encodeURIComponent(email)}`);
    if (response.status === 404) {
        return null; // Explicitly handle not found
    }
    if (!response.ok) {
        throw new Error('Failed to fetch customer');
    }
    // The backend now sends a single object, so we can directly return it.
    return response.json();
}


// Places an order by sending data to the backend
export async function placeOrder(customerId: string, items: CartItem[], total: number): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, items, total }),
    });
    if (!response.ok) throw new Error('Failed to place order');
    return await response.json();
}

// Fetches the status of a single order
export async function getOrderStatus(id: string): Promise<Order | null> {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch order status');
    }
    return response.json();
}

// --- Functions for the Assistant ---

/**
 * Searches for products based on a query string. (for the assistant)
 */
export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products?search=${encodeURIComponent(query)}&limit=5`);
    if (!response.ok) {
      console.error('API Error during product search:', response.status, response.statusText);
      return [];
    }
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Failed to search for products:', error);
    return [];
  }
}

/**
 * Gets all orders for a customer by their email address. (for the assistant)
 */
export async function getCustomerOrders(email: string): Promise<Order[]> {
  try {
    const customer = await getCustomerByEmail(email);
    if (!customer) {
      return []; // Return empty array if customer not found
    }
    const response = await fetch(`${API_BASE_URL}/orders?customerId=${customer._id}`);
    if (!response.ok) {
      console.error('API Error fetching customer orders:', response.status, response.statusText);
      return [];
    }
    // ** THIS IS THE FIX **
    // The API returns the array directly, so we just return the parsed JSON.
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch customer orders:', error);
    return [];
  }
}

export async function getBusinessMetrics(): Promise<BusinessMetrics> {
    const response = await fetch(`${API_BASE_URL}/dashboard/business-metrics`);
    if (!response.ok) throw new Error('Failed to fetch business metrics');
    return response.json();
}

export async function getAssistantStats(): Promise<AssistantStats> {
    const response = await fetch(`${API_BASE_URL}/dashboard/assistant-stats`);
    if (!response.ok) throw new Error('Failed to fetch assistant stats');
    return response.json();
}

export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const response = await fetch(`${API_BASE_URL}/dashboard/performance`);
    if (!response.ok) throw new Error('Failed to fetch performance metrics');
    return response.json();
}

export async function getDailyRevenue(from: string, to: string): Promise<DailyRevenue[]> {
    const response = await fetch(`${API_BASE_URL}/analytics/daily-revenue?from=${from}&to=${to}`);
    if (!response.ok) throw new Error('Failed to fetch daily revenue');
    return response.json();
}