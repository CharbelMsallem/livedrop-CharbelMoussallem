import { Order } from './api'; // <-- CORRECTED: Was OrderStatus

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Creates and manages a Server-Sent Events (SSE) connection for live order status updates.
 * @param orderId The ID of the order to track.
 * @param onUpdate A callback function that receives the updated order data.
 * @param onError A callback function for handling connection errors.
 * @returns The EventSource instance, which can be closed by the calling component.
 */
export function createOrderStatusStream(
  orderId: string,
  onUpdate: (data: Order) => void, 
  onError: (error: Event) => void
) {
  const eventSource = new EventSource(`${API_BASE_URL}/orders/${orderId}/stream`);

  eventSource.onmessage = (event) => {
    try {
      const orderData: Order = JSON.parse(event.data); // <-- CORRECTED: Was OrderStatus
      onUpdate(orderData);
    } catch (err) {
      console.error("Failed to parse SSE data:", err);
    }
  };

  eventSource.onerror = (err) => {
    console.error("EventSource failed:", err);
    onError(err);
    eventSource.close();
  };
  
  return eventSource;
}