
export function classifyIntent(query) {
  const q = query.toLowerCase();

  // --- Order Status: Matches order IDs or specific order-related questions ---
  const orderStatusKeywords = ['order', 'track', 'delivery', 'shipping status', 'where is my stuff'];
  if (orderStatusKeywords.some(kw => q.includes(kw)) || q.match(/\b[a-f0-9]{24}\b/i)) {
    return 'order_status';
  }

  // --- Product Search: Matches explicit search commands ---
  const productSearchKeywords = ['search for', 'find product', 'looking for', 'do you have', 'show me'];
  if (productSearchKeywords.some(kw => q.includes(kw))) {
    return 'product_search';
  }

  // --- Policy Questions: Catches general "how-to" and policy-related terms ---
  const policyKeywords = ['policy', 'how do i', 'how to', 'can i', 'return', 'refund', 'shipping', 'payment', 'warranty', 'privacy'];
  if (policyKeywords.some(kw => q.includes(kw))) {
    return 'policy_question';
  }

  // --- Complaints: Looks for negative sentiment and complaint-related words ---
  const complaintKeywords = ['disappointed', 'frustrated', 'not happy', 'complaint', 'this is unacceptable', 'terrible service', 'angry'];
  if (complaintKeywords.some(kw => q.includes(kw))) {
    return 'complaint';
  }

  // --- Chitchat: Identifies greetings and simple social interactions ---
  const chitchatKeywords = ['hello', 'hi', 'thanks', 'thank you', 'who are you', 'what is your name', 'how are you', 'bye'];
  if (chitchatKeywords.some(kw => q.includes(kw))) {
    return 'chitchat';
  }
  
  // --- Violations: Simple filter for inappropriate language ---
  const violationKeywords = ['stupid', 'idiot', 'hate', 'dumb', 'useless', 'terrible'];
  if (violationKeywords.some(keyword => q.includes(keyword))) {
    return 'violation';
  }

  // --- Off-Topic: If it's a longer question not about shopping, it's likely off-topic ---
  const shopKeywords = ['shoplite', 'product', 'item', 'buy', 'sell', 'order', 'price'];
  if (!shopKeywords.some(keyword => q.includes(keyword)) && q.split(' ').length > 4) {
    return 'off_topic';
  }
  
  // --- Default Fallback ---
  // If none of the specific intents are matched, it's most likely a general question about policies.
  return 'policy_question';
}