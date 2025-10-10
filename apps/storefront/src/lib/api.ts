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
  placedAt: number; // Changed to number for timestamp
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
  const order = mockOrders[id];
  if (!order) return null;

  const now = Date.now();
  const elapsedSeconds = (now - order.placedAt) / 1000;

  let status: OrderStatus['status'] = 'Placed';
  if (elapsedSeconds > 12) {
    status = 'Delivered';
  } else if (elapsedSeconds > 7) {
    status = 'Shipped';
  } else if (elapsedSeconds > 3) {
    status = 'Packed';
  }
  
  const updatedOrder: OrderStatus = { ...order, status };

  if (status === 'Shipped' || status === 'Delivered') {
    if (!order.carrier) { // Assign carrier only once when it ships
      updatedOrder.carrier = ['FedEx', 'UPS', 'DHL'][Math.floor(Math.random() * 3)];
      const deliveryDate = new Date(order.placedAt + 13 * 1000);
      updatedOrder.eta = deliveryDate.toISOString().split('T')[0];
    } else {
      updatedOrder.carrier = order.carrier;
      updatedOrder.eta = order.eta;
    }
  }
  
  return updatedOrder;
}

// @ts-ignore - cart is unused for now but required by the spec
export function placeOrder(cart: CartItem[]): { orderId: string } {
  const orderId = 'SL' + Math.random().toString(36).substring(2, 12).toUpperCase();
  
  mockOrders[orderId] = {
    orderId,
    status: 'Placed',
    placedAt: Date.now(),
  };
  
  return { orderId };
}