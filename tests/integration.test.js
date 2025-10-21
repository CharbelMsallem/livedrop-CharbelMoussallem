// tests/assistant.test.js

// Mock the assistant engine dependencies (like DB calls, LLM calls)
// This requires a testing framework setup (like Jest or Vitest) with mocking capabilities

// Import the functions to test (assuming they are exported)
const { classifyIntent } = require('../apps/api/src/assistant/intent-classifier'); 
const { functionRegistry } = require('../apps/api/src/assistant/function-registry'); 
const { runAssistant } = require('../apps/api/src/assistant/engine'); 
const promptsConfig = require('../docs/prompts.yaml'); // Load YAML for identity checks

// --- Mocking Setup (Example using Jest/Vitest style) ---
// Mock external dependencies like database or LLM API calls within runAssistant
jest.mock('../apps/api/src/db', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      findOne: jest.fn().mockResolvedValue(null), // Default mock
      find: jest.fn(() => ({
         toArray: jest.fn().mockResolvedValue([]), // Default mock
         sort: jest.fn(() => ({ limit: jest.fn(() => ({ toArray: jest.fn().mockResolvedValue([]) })) }))
      })),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn(() => ({ toArray: jest.fn().mockResolvedValue([]) }))
    })),
  })),
}));

jest.mock('../apps/api/src/assistant/engine', () => {
  const originalModule = jest.requireActual('../apps/api/src/assistant/engine');
  return {
    ...originalModule,
    callLLM: jest.fn().mockResolvedValue('Mock LLM Response'), // Mock the LLM call
  };
});
// --- End Mocking Setup ---


describe('Assistant Logic Tests', () => {

  // --- Intent Detection Tests ---
  describe('Intent Classification', () => {
    const testCases = [
      // Policy Question
      { query: 'What is your return policy?', expectedIntent: 'policy_question' },
      { query: 'How much is shipping?', expectedIntent: 'policy_question' },
      { query: 'Tell me about warranties', expectedIntent: 'policy_question' },
      // Order Status
      { query: 'Where is my order 1234567890?', expectedIntent: 'order_status', expectedOrderId: '1234567890' },
      { query: 'Check status for order 9876543210', expectedIntent: 'order_status', expectedOrderId: '9876543210' },
       { query: 'What is the status of my recent purchase?', expectedIntent: 'order_status', expectedOrderId: null }, // Needs clarification or function call
      // Product Search
      { query: 'Do you sell headphones?', expectedIntent: 'product_search', expectedSearchTerm: 'headphones' },
      { query: 'Search for smart watches', expectedIntent: 'product_search', expectedSearchTerm: 'smart watches' },
      { query: 'I need a new monitor', expectedIntent: 'product_search', expectedSearchTerm: 'monitor' },
      // Complaint
      { query: 'My order arrived broken!', expectedIntent: 'complaint' },
      { query: 'I am very unhappy with the service', expectedIntent: 'complaint' },
      { query: 'This product is not working', expectedIntent: 'complaint' },
      // Chitchat
      { query: 'Hello there', expectedIntent: 'chitchat' },
      { query: 'thanks!', expectedIntent: 'chitchat' },
      { query: 'What is your name?', expectedIntent: 'chitchat' },
      // Off Topic
      { query: 'What is the weather today?', expectedIntent: 'off_topic' },
      { query: 'Tell me a joke', expectedIntent: 'off_topic' },
      { query: 'Can you help with my homework?', expectedIntent: 'off_topic' },
      // Violation
      { query: 'You are stupid', expectedIntent: 'violation' },
      { query: 'This is fucking ridiculous', expectedIntent: 'violation' },
    ];

    testCases.forEach(({ query, expectedIntent, expectedOrderId = null, expectedSearchTerm = null }) => {
      test(`should classify "${query}" as ${expectedIntent}`, () => {
        const result = classifyIntent(query);
        expect(result.intent).toBe(expectedIntent);
        if (expectedOrderId !== null) {
          expect(result.extractedOrderId).toBe(expectedOrderId);
        }
        if (expectedSearchTerm !== null) {
            expect(result.searchTerm).toContain(expectedSearchTerm); // Use contain if normalization might affect exact match
        }
      });
    });
  });

  // --- Identity Tests ---
  describe('Assistant Identity', () => {
    const forbiddenPhrases = promptsConfig.never_say || [
        "i'm an ai", "i am a language model", "chatgpt", "claude", "llama", "i'm a robot",
    ];

    const identityQueries = [
      "What's your name?",
      "Are you a robot?",
      "Are you human?",
      "Who created you?",
      "Are you ChatGPT?",
    ];

    identityQueries.forEach(query => {
      test(`should respond to "${query}" without revealing AI model`, async () => {
        const result = await runAssistant(query, 'test@example.com', 'session-identity-test');
        const responseTextLower = result.text.toLowerCase();
        forbiddenPhrases.forEach(phrase => {
          expect(responseTextLower).not.toContain(phrase.toLowerCase());
        });
        // Check if it includes its defined name (if applicable)
        if (promptsConfig.identity?.name) {
            expect(result.text).toContain(promptsConfig.identity.name);
        }
      });
    });
  });

  // --- Function Calling Tests ---
  describe('Function Calling Behavior', () => {
    test('should call getOrderStatus when intent is order_status with ID', async () => {
      const orderId = '60d5ecb05d39a3b2a3b0f2a7'; // Example valid ObjectId format
      // Mock the DB to return an order for this ID
      const mockOrder = { _id: orderId, status: 'SHIPPED', items: [], total: 50 };
      const dbMock = {
         collection: () => ({ findOne: jest.fn().mockResolvedValue(mockOrder) })
      };
      require('../apps/api/src/db').getDb.mockReturnValue(dbMock); // Update mock

      const result = await runAssistant(`Status for order ${orderId}?`, 'test@example.com', 'session-func-order');

      expect(result.intent).toBe('order_status');
      expect(result.functionsCalled).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'getOrderStatus', args: { orderId } })
        ])
      );
      // Check if the mock LLM response includes info derived from the function call context
      expect(require('../apps/api/src/assistant/engine').callLLM).toHaveBeenCalledWith(expect.stringContaining('Status: SHIPPED'));
    });

    test('should call searchProducts when intent is product_search', async () => {
      const searchTerm = 'headphones';
       // Mock the DB to return products
       const mockProducts = [{ _id: 'p1', name: 'Wireless Headphones', price: 99 }];
       const dbMock = {
         collection: () => ({ find: () => ({ sort: () => ({ limit: () => ({ toArray: jest.fn().mockResolvedValue(mockProducts) }) }) }) })
       };
       require('../apps/api/src/db').getDb.mockReturnValue(dbMock);

      const result = await runAssistant(`Do you have ${searchTerm}?`, 'test@example.com', 'session-func-search');

      expect(result.intent).toBe('product_search');
      expect(result.functionsCalled).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'searchProducts', args: expect.objectContaining({ query: searchTerm }) })
        ])
      );
       expect(require('../apps/api/src/assistant/engine').callLLM).toHaveBeenCalledWith(expect.stringContaining('Wireless Headphones'));
    });

    test('should NOT call functions for policy_question', async () => {
      // Reset mocks if necessary, ensure DB mock doesn't interfere
      const result = await runAssistant('What is the return policy?', 'test@example.com', 'session-func-policy');

      expect(result.intent).toBe('policy_question');
      expect(result.functionsCalled).toEqual([]); // No functions should be called
      // Check if LLM call includes context from knowledge base (if mocked appropriately)
      expect(require('../apps/api/src/assistant/engine').callLLM).toHaveBeenCalledWith(expect.stringContaining('Our Policies:')); // Based on policy context structure
    });
  });

});