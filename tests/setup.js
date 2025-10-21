import { expect } from '@jest/globals';

// Make fetch available globally (Node 18+ has it built-in, but just in case)
if (typeof global.fetch === 'undefined') {
  const fetch = (await import('node-fetch')).default;
  global.fetch = fetch;
}

// Make EventSource available for SSE tests
if (typeof global.EventSource === 'undefined') {
  const EventSource = (await import('eventsource')).default;
  global.EventSource = EventSource;
}

// Export utilities
export { expect };