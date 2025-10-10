export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  tags: string[];
  stockQty: number;
  description: string;
}

export interface OrderStatus {
  orderId: string;
  status: 'Placed' | 'Packed' | 'Shipped' | 'Delivered';
  carrier?: string;
  eta?: string;
  placedAt: string;
}

export interface CartItem extends Product {
  quantity: number;
}

let catalogCache: Product[] | null = null;
const mockOrders: Record<string, OrderStatus> = {};

export async function listProducts(): Promise<Product[]> {
  if (catalogCache) return catalogCache;
  
  const response = await fetch('/mock-catalog.json');
  catalogCache = await response.json();
  return catalogCache!;
}

export async function getProduct(id: string): Promise<Product | null> {
  const products = await listProducts();
  return products.find(p => p.id === id) || null;
}

export function getOrderStatus(id: string): OrderStatus | null {
  if (mockOrders[id]) return mockOrders[id];
  
  const statuses: OrderStatus['status'][] = ['Placed', 'Packed', 'Shipped', 'Delivered'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  const order: OrderStatus = {
    orderId: id,
    status: randomStatus,
    placedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  
  if (randomStatus === 'Shipped' || randomStatus === 'Delivered') {
    order.carrier = ['FedEx', 'UPS', 'DHL'][Math.floor(Math.random() * 3)];
    const daysAhead = randomStatus === 'Shipped' ? Math.ceil(Math.random() * 3) : 0;
    order.eta = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }
  
  mockOrders[id] = order;
  return order;
}

export function placeOrder(cart: CartItem[]): { orderId: string } {
  const orderId = 'SL' + Math.random().toString(36).substring(2, 12).toUpperCase();
  
  mockOrders[orderId] = {
    orderId,
    status: 'Placed',
    placedAt: new Date().toISOString(),
  };
  
  return { orderId };
}