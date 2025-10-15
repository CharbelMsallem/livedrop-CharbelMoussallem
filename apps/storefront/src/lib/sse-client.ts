const API_BASE_URL = 'http://localhost:3000/api';

/**
 * A client for managing Server-Sent Events (SSE) connections.
 * It handles connection, reconnection with exponential backoff, and cleanup.
 */
class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectTimeoutId: number | null = null;
  private reconnectAttempts = 0;

  /**
   * Connects to an SSE endpoint for a specific order.
   * If a connection already exists, it will be closed before creating a new one.
   * @param orderId The ID of the order to receive status updates for.
   * @returns The EventSource instance.
   */
  public connect(orderId: string): EventSource {
    // If there's an existing connection, close it first.
    if (this.eventSource) {
      this.close();
    }

    const url = `${API_BASE_URL}/orders/status/${orderId}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('SSE connection established.');
      // Reset reconnect attempts on a successful connection.
      this.reconnectAttempts = 0;
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // The browser's default EventSource behavior will attempt to reconnect.
      // We can add custom logic here if needed, but for now, we'll rely on the default.
      // This is a good place to schedule a manual reconnect if the default fails.
      this.scheduleReconnect(orderId);
    };

    return this.eventSource;
  }

  /**
   * Schedules a reconnection attempt with exponential backoff.
   * @param orderId The ID of the order to reconnect to.
   */
  private scheduleReconnect(orderId: string): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, up to a max of 30s.
    const delay = Math.min(30000, Math.pow(2, this.reconnectAttempts) * 1000);
    this.reconnectAttempts++;

    console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);

    this.reconnectTimeoutId = window.setTimeout(() => {
      this.connect(orderId);
    }, delay);
  }

  /**
   * Closes the active SSE connection and clears any pending reconnect timers.
   */
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

// Export a singleton instance of the client.
export const sseClient = new SSEClient();