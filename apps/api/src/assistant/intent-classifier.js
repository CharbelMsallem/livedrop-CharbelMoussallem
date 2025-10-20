// apps/api/src/assistant/intent-classifier.js

const intentKeywords = {
  policy_question: ['policy', 'return', 'refund', 'shipping', 'warranty', 'privacy', 'security', 'tax', 'cost', 'fee', 'payment', 'accept', 'pay with', 'stock', 'badge', 'quantity', 'account', 'add to cart', 'how to buy', 'how do i'],
  order_status: ['order status', 'track my order', 'where is my order', 'delivery status', 'order #', 'order id'],
  order_count: ['how many orders', 'number of my orders', 'my total orders', 'count my orders'],
  product_search: ['search for', 'find', 'do you have', 'looking for', 'product', 'item', 'buy', 'shop for', 'price of', 'cost of', 'how much is'],
  product_count: ['how many products', 'total products', 'count products', 'number of items'],
  total_spendings: ['how much have i spent', 'how much did i spend', 'total spent', 'my spending', 'expenditure', 'total spending'],
  last_order: ['my last order', 'previous order', 'most recent purchase', 'what did i buy last'],
  complaint: ['issue', 'problem', 'complaint', 'wrong', 'broken', 'not working', 'unhappy', 'disappointed', 'frustrated'],
  chitchat: ['hello', 'hi', 'hey', 'thanks', 'thank you', 'bye', 'goodbye', 'how are you', 'your name'],
  violation: ['fuck', 'shit', 'damn', 'asshole', 'bitch', 'stupid', 'idiot'],
};

function extractOrderId(query) {
  const orderIdMatch = query.match(/(\b\d{10,}\b)|([a-fA-F0-9]{24})/);
  return orderIdMatch ? orderIdMatch[0] : null;
}

export function classifyIntent(query) {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return { intent: 'chitchat', extractedOrderId: null };
  }

  if (intentKeywords.violation.some(keyword => lowerQuery.includes(keyword))) {
    return { intent: 'violation', extractedOrderId: null };
  }

  // --- High-priority check for unambiguous policy terms ---
  if (['return', 'refund', 'shipping policy'].some(keyword => lowerQuery.includes(keyword))) {
    return { intent: 'policy_question', extractedOrderId: null };
  }

  // --- Check for specific, high-priority intents first ---

  const orderId = extractOrderId(lowerQuery);
  if (intentKeywords.order_status.some(keyword => lowerQuery.includes(keyword)) || orderId) {
    return { intent: 'order_status', extractedOrderId: orderId };
  }

  if (intentKeywords.order_count.some(keyword => lowerQuery.includes(keyword))) {
      return { intent: 'order_count', extractedOrderId: null };
  }

  if (intentKeywords.last_order.some(keyword => lowerQuery.includes(keyword))) {
    return { intent: 'last_order', extractedOrderId: null };
  }

  if (intentKeywords.total_spendings.some(keyword => lowerQuery.includes(keyword))) {
    return { intent: 'total_spendings', extractedOrderId: null };
  }

  if (intentKeywords.product_count.some(keyword => lowerQuery.includes(keyword))) {
    return { intent: 'product_count', extractedOrderId: null };
  }

  // --- Check for policy questions BEFORE generic product searches ---
  if (intentKeywords.policy_question.some(keyword => lowerQuery.includes(keyword))) {
      // Avoid misclassifying "how much is a product" as a policy question
      if (!intentKeywords.product_search.some(searchKw => lowerQuery.includes(searchKw))) {
        return { intent: 'policy_question', extractedOrderId: null };
      }
  }


  const productSearchKeyword = intentKeywords.product_search.find(keyword => lowerQuery.includes(keyword));
  if (productSearchKeyword) {
    let searchTerm = lowerQuery.replace(productSearchKeyword, '').trim();
    searchTerm = searchTerm.replace(/^the |^an |^a |^\?|\?$/g, '').trim();
    return { intent: 'product_search', extractedOrderId: null, searchTerm: searchTerm || null };
  }

  // --- Fallback intents ---

  if (intentKeywords.complaint.some(keyword => lowerQuery.includes(keyword))) {
    return { intent: 'complaint', extractedOrderId: null };
  }

  if (intentKeywords.chitchat.some(keyword => lowerQuery.includes(keyword))) {
    return { intent: 'chitchat', extractedOrderId: null };
  }
  
  // --- FINAL HEURISTIC: Assume short, unrecognized queries are product searches ---
  // If no other intent has been matched, and the query is reasonably short,
  // treat it as a direct search for a product. This handles follow-ups like "4k ultra hd smart tv".
  if (lowerQuery.split(' ').length <= 6) {
    return { intent: 'product_search', extractedOrderId: null, searchTerm: lowerQuery };
  }


  return { intent: 'off_topic', extractedOrderId: null };
}