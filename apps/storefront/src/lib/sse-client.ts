const API_BASE_URL = 'http://localhost:3000/api';

/**
 * A client for managing Server-Sent Events (SSE) connections.
 */
class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectTimeoutId: number | null = null;
  private reconnectAttempts = 0;

  public connect(orderId: string): EventSource {
    if (this.eventSource) {
      this.close();
    }

    // URL to match the backend route structure
    const url = `${API_BASE_URL}/orders/status/${orderId}/stream`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('SSE connection established.');
      this.reconnectAttempts = 0;
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.scheduleReconnect(orderId);
    };

    return this.eventSource;
  }

  private scheduleReconnect(orderId: string): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    const delay = Math.min(30000, Math.pow(2, this.reconnectAttempts) * 1000);
    this.reconnectAttempts++;

    console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);

    this.reconnectTimeoutId = window.setTimeout(() => {
      this.connect(orderId);
    }, delay);
  }

  public close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('SSE connection closed.');
    }
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }
}

export const sseClient = new SSEClient();