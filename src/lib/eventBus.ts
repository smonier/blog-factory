/**
 * Simple event bus for cross-component communication
 * Used to notify stats updates when rating or commenting
 */

type EventCallback = (data?: unknown) => void;

class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.events.get(event)?.delete(callback);
    };
  }

  /**
   * Emit an event
   */
  emit(event: string, data?: unknown): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in callback for event "${event}":`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   */
  off(event: string): void {
    this.events.delete(event);
  }
}

// Global singleton instance
export const eventBus = new EventBus();

// Event names
export const EVENTS = {
  RATING_UPDATED: "rating:updated",
  COMMENT_ADDED: "comment:added",
} as const;
