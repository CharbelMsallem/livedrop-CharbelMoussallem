// apps/storefront/src/lib/api.ts

// The base URL of your running backend API
const API_BASE_URL = 'http://localhost:3000/api';


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
  items: { productId: string, name: string, price: number, quantity: number }[];
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
    const data = await response.json();
    return data.orders || []; // Assuming the API returns { orders: [...] }
  } catch (error) {
    console.error('Failed to fetch customer orders:', error);
    return [];
  }
}