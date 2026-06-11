/**
 * Realtime Socket Abstraction
 * Currently a mock implementation to be replaced with Pusher or Socket.io
 */

type EventHandler = (data: any) => void;

class SocketClient {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe to a specific event
   */
  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)?.push(handler);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: EventHandler) {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      this.handlers.set(event, eventHandlers.filter(h => h !== handler));
    }
  }

  /**
   * Simulate an incoming event (for dev/mocking)
   */
  simulate(event: string, data: any) {
    this.handlers.get(event)?.forEach(handler => handler(data));
  }
}

export const socket = new SocketClient();
export default socket;
