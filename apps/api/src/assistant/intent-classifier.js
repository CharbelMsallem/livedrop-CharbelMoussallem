
// export function classifyIntent(query) {
//   const q = query.toLowerCase();

//   // --- Order Status: Matches order IDs or specific order-related questions ---
//   const orderStatusKeywords = ['order', 'track', 'delivery', 'shipping status', 'where is my stuff', 'my purchase'];
//   // Match 24-char hex string (MongoDB ID)
//   if (orderStatusKeywords.some(kw => q.includes(kw)) || q.match(/\b[a-f0-9]{24}\b/i)) {
//     // Differentiate asking for general orders vs specific ID
//     if (!q.match(/\b[a-f0-9]{24}\b/i) && (q.includes('my order') || q.includes('my purchase'))) {
//        // Could refine further, but let engine handle email lookup if no ID
//     }
//     return 'order_status';
//   }

//   // *** NEW INTENT: Product Count ***
//   const productCountKeywords = ['how many products', 'total products', 'count items', 'number of items'];
//    if (productCountKeywords.some(kw => q.includes(kw))) {
//     return 'product_count';
//   }

//   // --- Product Search: Matches explicit search commands ---
//   const productSearchKeywords = ['search for', 'find product', 'looking for', 'do you have', 'show me items'];
//   if (productSearchKeywords.some(kw => q.includes(kw))) {
//     return 'product_search';
//   }

//   // --- Policy Questions: Catches general "how-to" and policy-related terms ---
//   const policyKeywords = ['policy', 'how do i', 'how to', 'can i', 'return', 'refund', 'shipping', 'payment', 'warranty', 'privacy', 'account', 'security', 'taxes'];
//   if (policyKeywords.some(kw => q.includes(kw))) {
//     return 'policy_question';
//   }

//   // --- Complaints: Looks for negative sentiment and complaint-related words ---
//   const complaintKeywords = ['disappointed', 'frustrated', 'not happy', 'complaint', 'this is unacceptable', 'terrible service', 'angry', 'issue', 'problem'];
//   if (complaintKeywords.some(kw => q.includes(kw))) {
//     return 'complaint';
//   }

//   // --- Chitchat: Identifies greetings and simple social interactions ---
//   const chitchatKeywords = ['hello', 'hi', 'thanks', 'thank you', 'who are you', 'what is your name', 'how are you', 'bye', 'my name is'];
//   if (chitchatKeywords.some(kw => q.includes(kw))) {
//     return 'chitchat';
//   }

//   // --- Violations: Simple filter for inappropriate language ---
//   const violationKeywords = ['stupid', 'idiot', 'hate', 'dumb', 'useless', 'terrible', 'fuck', 'shit']; // Added common profanity
//   if (violationKeywords.some(keyword => q.includes(keyword))) {
//     return 'violation';
//   }

//   // --- Off-Topic: If it's a longer question not about shopping, it's likely off-topic ---
//   const shopKeywords = ['shoplite', 'product', 'item', 'buy', 'sell', 'order', 'price', 'cart', 'checkout'];
//   if (!shopKeywords.some(keyword => q.includes(keyword)) && q.split(' ').length > 4) {
//     return 'off_topic';
//   }

//   // --- Default Fallback ---
//   // If none of the specific intents are matched, treat as potential policy question or product search.
//   // Let the engine handle context gathering (which might find nothing, leading to refusal).
//   console.log(`INFO: No specific intent matched for query: "${query}". Defaulting to policy_question.`);
//   return 'policy_question';
// }


export function classifyIntent(query) {
  const q = query.toLowerCase();

  // --- Order Status ---
  const orderStatusKeywords = ['order', 'track', 'delivery', 'shipping status', 'where is my stuff', 'my purchase'];
  if (orderStatusKeywords.some(kw => q.includes(kw)) || q.match(/\b[a-f0-9]{24}\b/i)) {
      // *** NEW: Check for "last order" specifically ***
      if (q.includes('last order') || q.includes('most recent order')) {
          return 'last_order';
      }
      return 'order_status';
  }

  // --- Product Count ---
  const productCountKeywords = ['how many products', 'total products', 'count items', 'number of items'];
   if (productCountKeywords.some(kw => q.includes(kw)) && !q.includes('search')) { // Avoid conflict with search
    return 'product_count';
  }

  // *** NEW: Product Stock Check ***
  const productStockKeywords = ['stock', 'available', 'in stock', 'how many left'];
  if (productStockKeywords.some(kw => q.includes(kw)) && (q.includes('product') || q.includes('item') || q.match(/do you have|check for/))) {
      // Requires a product name, but classification can be broad
      return 'product_stock';
  }

  // --- Product Search ---
  const productSearchKeywords = ['search for', 'find product', 'looking for', 'do you have', 'show me items'];
  // Avoid classifying stock checks as general search
  if (productSearchKeywords.some(kw => q.includes(kw)) && !productStockKeywords.some(skw => q.includes(skw))) {
    return 'product_search';
  }

  // *** NEW: Total Spendings ***
  const spendingKeywords = ['spent', 'spendings', 'total amount', 'much have i'];
  if (spendingKeywords.some(kw => q.includes(kw))) {
      return 'total_spendings';
  }

  // *** NEW: Account Details ***
  const accountKeywords = ['my account', 'my details', 'my address', 'my email', 'my phone'];
  if (accountKeywords.some(kw => q.includes(kw))) {
      return 'account_details';
  }

   // --- Policy Questions ---
  const policyKeywords = ['policy', 'how do i', 'how to', 'can i', 'return', 'refund', 'shipping', 'payment', 'warranty', 'privacy', 'account', 'security', 'taxes'];
  // Make sure it wasn't caught by a more specific intent above
  if (policyKeywords.some(kw => q.includes(kw)) && !accountKeywords.some(akw => q.includes(akw)) ) {
    return 'policy_question';
  }

  // --- Complaints ---
  const complaintKeywords = ['disappointed', 'frustrated', 'not happy', 'complaint', 'this is unacceptable', 'terrible service', 'angry', 'issue', 'problem'];
  if (complaintKeywords.some(kw => q.includes(kw))) {
    return 'complaint';
  }

  // --- Chitchat ---
  const chitchatKeywords = ['hello', 'hi', 'thanks', 'thank you', 'who are you', 'what is your name', 'how are you', 'bye', 'my name is'];
  if (chitchatKeywords.some(kw => q.includes(kw))) {
    return 'chitchat';
  }

  // --- Violations ---
  const violationKeywords = ['stupid', 'idiot', 'hate', 'dumb', 'useless', 'terrible', 'fuck', 'shit'];
  if (violationKeywords.some(keyword => q.includes(keyword))) {
    return 'violation';
  }

  // --- Off-Topic ---
  const shopKeywords = ['shoplite', 'product', 'item', 'buy', 'sell', 'order', 'price', 'cart', 'checkout', 'shipping', 'return'];
  if (!shopKeywords.some(keyword => q.includes(keyword)) && q.split(' ').length > 3 && !chitchatKeywords.some(ckw => q.includes(ckw))) {
      // Increased threshold slightly, check against chitchat
      return 'off_topic';
  }

  // --- Default Fallback ---
  // If query is short and none matched, assume chitchat or requires clarification
   if (q.split(' ').length < 4) {
       return 'chitchat'; // Or potentially a new 'clarification_needed' intent
   }

  // Longer queries not matching specific keywords likely fall back to policy/search attempt
  console.log(`INFO: No specific intent matched for query: "${query}". Defaulting to policy_question.`);
  return 'policy_question';
}