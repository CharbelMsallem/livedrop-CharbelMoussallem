// apps/api/src/assistant/intent-classifier.js

const intentKeywords = {
  // High priority identity/chitchat patterns
  chitchat: {
    identity: [
      'what is your name', 'who are you', 'are you a robot', 'are you ai', 
      'are you a bot', 'are you human', 'are you chatgpt', 'who created you',
      'what do you do', 'what is your purpose', 'your name', 'tell me about yourself'
    ],
    greetings: ['hello', 'hi there', 'hey there', 'good morning', 'good afternoon'],
    courtesy: ['thank you', 'thanks', 'bye', 'goodbye'],
    casual: ['how are you', 'who created you', 'that\'s it']
  },
  
  policy_question: ['policy', 'return', 'refund', 'shipping', 'warranty', 'privacy', 'security', 'tax', 'payment method',
                    'accept payment', 'pay with', 'how to buy', 'how do i return', 'how do i get a refund', 'shipping fee', 'warranties', 'warranty'],
  
  order_status: ['order status', 'track my order', 'where is my order', 'delivery status', 'order #', 'order id'],
  
  order_count: ['how many orders', 'number of my orders', 'my total orders', 'count my orders'],
  
  product_search: {
    explicit: ['search for', 'find product', 'do you have', 'do you sell', 'looking for',
               'buy a', 'shop for', 'show me', 'available', 'looking to buy', 'want to buy', 'i need a', 'i need to buy'],
    implicit: ['price of', 'cost of', 'how much is']
  },
  
  product_count: ['how many products', 'total products', 'count all items', 'number of items', 'products in stock'],
  
  total_spendings: ['how much have i spent', 'how much did i spend', 'total spent', 'my spending', 'expenditure', 'total spending'],
  
  last_order: ['my last order', 'previous order', 'most recent purchase', 'what did i buy last', 'latest order'],
  
  complaint: ['issue', 'problem', 'complaint', 'wrong', 'broken', 'not working', 'unhappy', 'disappointed', 'frustrated'],
  
  off_topic: [
    'joke', 'weather', 'homework', 'capital of', 'election', 'won', 'jumped',
    'meaning of life', 'tell me a story', 'who won', 'what is the weather', 'tell me a joke'
  ],

  violation: ['fuck', 'shit', 'damn', 'asshole', 'bitch', 'stupid', 'idiot']
};

function extractOrderId(query) {
  const orderIdMatch = query.match(/(\b\d{10,}\b)|([a-fA-F0-9]{24})/);
  return orderIdMatch ? orderIdMatch[0] : null;
}

function normalizeQuery(query) {
  return query.toLowerCase().trim()
    .replace(/[?!.,;:]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function classifyIntent(query) {
  const normalized = normalizeQuery(query);
  
  if (!normalized) {
    return { intent: 'chitchat', extractedOrderId: null };
  }

  // 1. Violations (highest priority)
  if (intentKeywords.violation.some(kw => normalized.includes(kw))) {
    return { intent: 'violation', extractedOrderId: null };
  }

  // 2. Identity/Chitchat (before product search to prevent misclassification)
  for (const [category, phrases] of Object.entries(intentKeywords.chitchat)) {
    if (phrases.some(phrase => normalized.includes(phrase))) {
      return { intent: 'chitchat', extractedOrderId: null };
    }
  }

  // 3. Order-related intents with high specificity
  const orderId = extractOrderId(normalized);
  if (intentKeywords.order_status.some(kw => normalized.includes(kw)) || orderId) {
    return { intent: 'order_status', extractedOrderId: orderId };
  }
  
  if (intentKeywords.last_order.some(kw => normalized.includes(kw))) {
    return { intent: 'last_order', extractedOrderId: null };
  }
  
  if (intentKeywords.order_count.some(kw => normalized.includes(kw))) {
    return { intent: 'order_count', extractedOrderId: null };
  }
  
  if (intentKeywords.total_spendings.some(kw => normalized.includes(kw))) {
    return { intent: 'total_spendings', extractedOrderId: null };
  }

  // 4. Product count (specific query)
  if (intentKeywords.product_count.some(kw => normalized.includes(kw))) {
    return { intent: 'product_count', extractedOrderId: null };
  }

  // 5. Policy questions (before product search)
  if (intentKeywords.policy_question.some(kw => normalized.includes(kw))) {
    return { intent: 'policy_question', extractedOrderId: null };
  }

  // 6. Explicit Off-topic 
  if (intentKeywords.off_topic.some(kw => normalized.includes(kw))) {
    return { intent: 'off_topic', extractedOrderId: null };
  }

  // 7. Product search (explicit indicators)
  const explicitSearchMatch = intentKeywords.product_search.explicit.find(kw => normalized.includes(kw));
  if (explicitSearchMatch) {
    let searchTerm = normalized.replace(explicitSearchMatch, '').trim();
    searchTerm = searchTerm.replace(/^(the|an|a|any|some)\s+/g, '').trim();
    return { 
      intent: 'product_search', 
      extractedOrderId: null, 
      searchTerm: searchTerm || normalized 
    };
  }

  // 8. Product search (implicit - price/cost questions)
  const implicitSearchMatch = intentKeywords.product_search.implicit.find(kw => normalized.includes(kw));
  if (implicitSearchMatch) {
    let searchTerm = normalized.replace(implicitSearchMatch, '').trim();
    searchTerm = searchTerm.replace(/^(the|an|a)\s+/g, '').trim();
    return { 
      intent: 'product_search', 
      extractedOrderId: null, 
      searchTerm: searchTerm || normalized 
    };
  }

  // 9. Complaint detection
  if (intentKeywords.complaint.some(kw => normalized.includes(kw))) {
    return { intent: 'complaint', extractedOrderId: null };
  }

  // 10. Short product queries (heuristic for simple product names)
  const words = normalized.split(' ');
  if (words.length <= 4 && words.length >= 1) {
    const commonNonProductWords = ['what', 'how', 'why', 'when', 'where', 'can', 'could', 'should', 'would'];
    if (!commonNonProductWords.some(w => words.includes(w))) {
      return { 
        intent: 'product_search', 
        extractedOrderId: null, 
        searchTerm: normalized 
      };
    }
  }

  // 11. Default to off_topic (This remains as the fallback)
  return { intent: 'off_topic', extractedOrderId: null };
}