// apps/api/src/assistant/engine.js

import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { classifyIntent } from './intent-classifier.js';
import { functionRegistry } from './function-registry.js';
import { getDb } from '../db.js';

const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let promptsConfig;
let knowledgeBase = [];

try {
  const promptsFilePath = path.join(__dirname, '../../../../docs/prompts.yaml');
  promptsConfig = yaml.load(fs.readFileSync(promptsFilePath, 'utf8'));
  console.log("Prompts configuration loaded successfully.");
} catch (e) {
  console.error("Failed to load prompts.yaml:", e);
  promptsConfig = {};
}

try {
  const kbFilePath = path.join(__dirname, '../../../../docs/ground-truth.json');
  knowledgeBase = JSON.parse(fs.readFileSync(kbFilePath, 'utf8'));
  console.log(`Knowledge base loaded successfully with ${knowledgeBase.length} policies.`);
} catch (e) {
  console.error("Failed to load ground-truth.json:", e);
  knowledgeBase = [];
}

const LLM_GENERATE_URL = process.env.LLM_GENERATE_URL;
if (!LLM_GENERATE_URL) {
    console.warn("LLM_GENERATE_URL environment variable is not set. Assistant LLM calls will fail.");
}

const conversationHistories = {};
const MAX_HISTORY_LENGTH = 6;

// Response cache with 5-minute TTL
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function logAssistantInteraction(data) {
    try {
        const db = getDb();
        await db.collection('assistant_logs').insertOne({
            ...data,
            createdAt: new Date(),
        });
    } catch (error) {
        console.error("Failed to log assistant interaction:", error);
    }
}

function getConversationHistory(sessionId) {
    return conversationHistories[sessionId] || [];
}

function addToConversationHistory(sessionId, role, content, intent) {
    if (!sessionId) return;
    if (!conversationHistories[sessionId]) {
        conversationHistories[sessionId] = [];
    }
    const message = role === 'user' ? { role, content, intent } : { role, content };
    conversationHistories[sessionId].push(message);
    if (conversationHistories[sessionId].length > MAX_HISTORY_LENGTH) {
        conversationHistories[sessionId] = conversationHistories[sessionId].slice(-MAX_HISTORY_LENGTH);
    }
}

function formatHistoryForPrompt(history) {
    return history.map(msg => `<|im_start|>${msg.role}\n${msg.content}<|im_end|>`).join('\n');
}

async function getCustomerByEmail(email) {
    if (!email) return null;
    try {
        const db = getDb();
        return await db.collection('customers').findOne({ email: email });
    } catch (error) {
        console.error(`Error fetching customer by email ${email}:`, error);
        return null;
    }
}

function findRelevantPolicies(query) {
  const lowerQuery = query.toLowerCase();
  const keywords = {
    Account: ['account', 'login', 'password', 'email', 'profile', 'sign in', 'register'],
    Orders: ['order', 'purchase', 'history', 'past order'],
    Shipping: ['ship', 'delivery', 'carrier', 'cost', 'fee', 'free shipping', 'options'],
    Returns: ['return', 'refund', 'exchange', 'money back', 'rma'],
    Payment: ['payment', 'pay', 'card', 'tax', 'billing', 'charge', 'method'],
    Products: ['product', 'item', 'search', 'find', 'catalog', 'stock', 'available'],
    Support: ['support', 'help', 'contact'],
    Security: ['secure', 'security', 'safe', 'privacy', 'guarantee'],
    Cart: ['cart', 'basket', 'checkout'],
  };

  for (const [category, kws] of Object.entries(keywords)) {
    if (kws.some(kw => lowerQuery.includes(kw))) {
      const matches = knowledgeBase.filter(doc => doc.category.toLowerCase() === category.toLowerCase());
      if (matches.length > 0) return matches.slice(0, 2); // Max 2 policies
    }
  }
  
  return knowledgeBase.slice(0, 2); // Return top 2 if no specific match
}

function validateCitations(responseText) {
  const citations = [...responseText.matchAll(/\[([a-zA-Z]+\d+\.\d+)\]/g)].map(m => m[1]);
  const validCitations = new Set();
  const invalidCitations = [];
  
  for (const citation of citations) {
    if (knowledgeBase.some(doc => doc.id === citation)) {
      validCitations.add(citation);
    } else {
      invalidCitations.push(citation);
    }
  }
  
  return {
      isValid: invalidCitations.length === 0,
      validCitations: Array.from(validCitations),
      invalidCitations
  };
}

async function callLLM(prompt) {
    if (!LLM_GENERATE_URL) throw new Error("LLM endpoint URL is not configured.");
    
    try {
        const response = await fetch(LLM_GENERATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt, max_tokens: 400 }), // Increased for more detailed responses
        });
        
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[LLM Call] API Error ${response.status}: ${errorBody}`);
            throw new Error(`LLM API request failed with status ${response.status}`);
        }
        
        const result = await response.json();
        let generatedText = result.text || '';
        
        // Clean up response
        generatedText = generatedText.replace(/^(Answer:|Response:)\s*/i, '').trim();
        
        return generatedText;
    } catch (error) {
        console.error(`[LLM Call] Error: ${error.message}`);
        throw new Error(`Failed to communicate with the LLM service: ${error.message}`);
    }
}

// Enhanced prompt builder for richer responses
function buildPrompt(intent, intentConfig, context, query, history) {
  const identity = promptsConfig?.identity || { name: "Nio", role: "Support Specialist", personality: "Helpful" };
  const { name, role, personality } = identity;
  const { behavior = 'Assist the user', tone = 'Professional' } = intentConfig || {};

  let prompt = `<|im_start|>system
You are ${name}, a ${role} at Shoplite.
Personality: ${personality}

Your task: ${behavior}
Communication style: ${tone}

Guidelines:
- Respond ONLY in English, regardless of input language
- Never mention being AI, bot, or language model - you are ${name}
- Base answers strictly on the CONTEXT provided
- Be conversational and helpful (3-5 sentences)
- For policy questions: cite using [PolicyID] format
- Add helpful suggestions when appropriate
<|im_end|>\n`;

    if (history && history.length > 0) {
        prompt += formatHistoryForPrompt(history.slice(-4)) + '\n';
    }

    prompt += `<|im_start|>user\n`;
    if (context) {
        prompt += `CONTEXT:\n${context}\n\n`;
    }
    prompt += `${query}\n<|im_end|>\n<|im_start|>assistant\n`;
    
    return prompt;
}

function formatOrderContext(orderData) {
    if (!orderData) return 'Order not found.';
    
    const statusEmoji = {
        'PENDING': '⏳',
        'PROCESSING': '📦',
        'SHIPPED': '🚚',
        'DELIVERED': '✅'
    };
    
    let context = `Order Details:\n`;
    context += `${statusEmoji[orderData.status] || ''} Status: ${orderData.status}\n`;
    context += `Order ID: ${orderData._id}\n`;
    context += `Placed: ${new Date(orderData.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n`;
    context += `Total: ${formatCurrency(orderData.total)}\n`;
    
    if (orderData.status === 'SHIPPED' || orderData.status === 'DELIVERED') {
        if (orderData.carrier) context += `Carrier: ${orderData.carrier}\n`;
        if (orderData.estimatedDelivery) {
            context += `Estimated Delivery: ${new Date(orderData.estimatedDelivery).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}\n`;
        }
    }
    
    context += `\nItems Ordered:\n`;
    orderData.items.forEach((item, idx) => {
        context += `  ${idx + 1}. ${item.name} - Qty: ${item.quantity} (${formatCurrency(item.price)})\n`;
    });
    
    return context;
}

// Enhanced quick responses with more personality
const QUICK_RESPONSES = {
  off_topic: "I can only assist with questions about Shoplite products, orders, and our store policies. I cannot provide information on other topics. Is there anything about Shoplite I can help you with?",
  
  violation: "I'm here to help, but I need to keep our conversation professional and respectful. How can I assist you with your Shoplite needs today?",
  
  no_order_id: "I'd be happy to check on your order! Could you please provide the order ID? You can find it in your confirmation email or order history.",
  
  no_user_identity: "To look that up for you, I'll need you to provide your email address or log in to your account. This helps me find your specific information securely."
};

export async function runAssistant(query, userEmail, sessionId) {
  console.log(`[Assistant] Processing: "${query.substring(0, 50)}..."`);
  const startTime = Date.now();
  
  // Check cache for identical queries
  const cacheKey = `${query.toLowerCase()}_${userEmail || 'anon'}`;
  if (responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Assistant] Cache hit`);
      return { ...cached.response, cached: true };
    }
    responseCache.delete(cacheKey);
  }
  
  const history = getConversationHistory(sessionId);
  let intentResult = classifyIntent(query);
  let context = '';
  let responseText = '';
  let functionsCalled = [];
  let citations = { isValid: true, validCitations: [], invalidCitations: [] };
  let customer = null;
  let intentConfig = promptsConfig?.intents?.[intentResult.intent] || {};

  try {
    if (userEmail) {
      customer = await getCustomerByEmail(userEmail);
    }

    // Handle quick responses
    if (intentResult.intent === 'off_topic') {
      responseText = QUICK_RESPONSES.off_topic;
    } else if (intentResult.intent === 'violation') {
      responseText = QUICK_RESPONSES.violation;
    } else {
      // Build context and call functions
      switch (intentResult.intent) {
        case 'policy_question':
          const policies = findRelevantPolicies(query);
          if (policies.length > 0) {
            context = `Our Policies:\n\n` + policies.map(p => 
              `Policy [${p.id}]:\nQ: ${p.question}\nA: ${p.answer}\nCategory: ${p.category}`
            ).join('\n\n---\n\n');
          } else {
            context = 'No specific policy found for this question in our knowledge base.';
          }
          break;

        case 'order_status':
          if (intentResult.extractedOrderId) {
            const order = await functionRegistry.execute('getOrderStatus', { orderId: intentResult.extractedOrderId });
            functionsCalled.push({ name: 'getOrderStatus', args: { orderId: intentResult.extractedOrderId } });
            
            if (order) {
              context = formatOrderContext(order);
            } else {
              responseText = `I couldn't find an order with ID ${intentResult.extractedOrderId}. Please double-check the order number, or feel free to provide your email so I can look up your recent orders.`;
            }
          } else {
            responseText = QUICK_RESPONSES.no_order_id;
          }
          break;

        case 'order_count':
          if (customer) {
            const result = await functionRegistry.execute('countCustomerOrders', { customerId: customer._id.toString() });
            functionsCalled.push({ name: 'countCustomerOrders', args: { customerId: customer._id.toString() } });
            context = `Customer Order History:\nTotal Orders Placed: ${result.orderCount}\nCustomer since: ${new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
          } else {
            responseText = QUICK_RESPONSES.no_user_identity;
          }
          break;

        case 'product_search':
          if (intentResult.searchTerm) {
            const products = await functionRegistry.execute('searchProducts', { query: intentResult.searchTerm, limit: 3 });
            functionsCalled.push({ name: 'searchProducts', args: { query: intentResult.searchTerm, limit: 3 } });
            
            if (products.length > 0) {
              context = `Search Results for "${intentResult.searchTerm}":\n\n`;
              products.forEach((p, idx) => {
                context += `${idx + 1}. ${p.name}\n`;
                context += `   Price: ${formatCurrency(p.price)}\n`;
                context += `   ${p.description.substring(0, 80)}...\n`;
                context += `   Stock: ${p.stock > 0 ? `${p.stock} available` : 'Out of stock'}\n\n`;
              });
            } else {
              context = `Search Results:\nNo products found matching "${intentResult.searchTerm}".\nSuggestion: Try broader terms or check our full catalog.`;
            }
          } else {
            responseText = "I'd love to help you find a product! What are you looking for today? You can search by product name, category, or describe what you need.";
          }
          break;

        case 'last_order':
          if (customer) {
            const orders = await functionRegistry.execute('getCustomerOrders', { customerId: customer._id.toString(), limit: 1 });
            functionsCalled.push({ name: 'getCustomerOrders', args: { customerId: customer._id.toString(), limit: 1 } });
            
            if (orders.length > 0) {
              context = `Your Most Recent Order:\n\n` + formatOrderContext(orders[0]);
            } else {
              context = `Order History:\nNo previous orders found for ${customer.email}.\nReady to place your first order?`;
            }
          } else {
            responseText = QUICK_RESPONSES.no_user_identity;
          }
          break;

        case 'product_count':
          const count = await functionRegistry.execute('getProductCount', {});
          functionsCalled.push({ name: 'getProductCount', args: {} });
          context = `Store Inventory:\nTotal Products: ${count} items across multiple categories\nNew items added regularly`;
          break;

        case 'total_spendings':
          if (customer) {
            const spending = await functionRegistry.execute('getTotalSpendings', { customerId: customer._id.toString() });
            functionsCalled.push({ name: 'getTotalSpendings', args: { customerId: customer._id.toString() } });
            
            const avgOrder = spending.orderCount > 0 ? spending.totalSpent / spending.orderCount : 0;
            context = `Shopping Summary for ${customer.name}:\n`;
            context += `Total Spent: ${formatCurrency(spending.totalSpent)}\n`;
            context += `Total Orders: ${spending.orderCount}\n`;
            context += `Average Order Value: ${formatCurrency(avgOrder)}`;
          } else {
            responseText = QUICK_RESPONSES.no_user_identity;
          }
          break;

        case 'chitchat':
          if (query.toLowerCase().includes('name')) {
            responseText = `I'm Nio, your Shoplite Support Specialist! I'm here to help you with products, orders, shipping, returns, and any questions about our store. What can I assist you with today?`;
          } else if (query.toLowerCase().includes('who are you') || query.toLowerCase().includes('robot')) {
            responseText = `I'm Nio from the Shoplite support team! I help customers like you find products, track orders, and answer questions about our policies. How can I make your shopping experience better?`;
          } else if (query.toLowerCase().includes('created') || query.toLowerCase().includes('made')) {
            responseText = `I'm part of the Shoplite customer support team, here to make your shopping experience smooth and enjoyable! What would you like help with today?`;
          } else {
            context = "Casual conversation - respond briefly and redirect to support topics.";
          }
          break;

        case 'complaint':
          context = `Customer Concern:\nThe customer has expressed dissatisfaction or reported an issue.\nApproach: Show empathy, apologize for inconvenience, ask for specific details to help resolve the issue.`;
          break;
      }

      // Call LLM only if we don't have a quick response
      if (!responseText && context) {
        const prompt = buildPrompt(intentResult.intent, intentConfig, context, query, history);
        responseText = await callLLM(prompt);
        
        // Validate citations for policy questions
        if (intentResult.intent === 'policy_question') {
          citations = validateCitations(responseText);
          if (!citations.isValid) {
            console.warn(`[Assistant] Invalid citations: ${citations.invalidCitations.join(', ')}`);
          }
        }
      }
    }

    const processingTime = Date.now() - startTime;

    // Log interaction
    await logAssistantInteraction({
        sessionId,
        userEmail: userEmail || 'anonymous',
        query,
        intent: intentResult.intent,
        responseText,
        functionsCalled: functionsCalled.length > 0 ? functionsCalled : undefined,
        processingTime,
        citations: intentResult.intent === 'policy_question' ? citations : undefined,
    });

    // Update history
    addToConversationHistory(sessionId, 'user', query, intentResult.intent);
    addToConversationHistory(sessionId, 'assistant', responseText);

    const result = {
      text: responseText,
      intent: intentResult.intent,
      citations,
      functionsCalled,
      processingTime,
    };

    // Cache non-personalized responses
    if (!customer && ['policy_question', 'product_search', 'product_count', 'off_topic'].includes(intentResult.intent)) {
      responseCache.set(cacheKey, { response: result, timestamp: Date.now() });
    }

    console.log(`[Assistant] Processed in ${processingTime}ms. Intent: ${intentResult.intent}`);
    
    // --- START: ADDED LOGGING ---
    console.log('Return:', {
        text: responseText.substring(0, 75) + (responseText.length > 75 ? '...' : ''), // Truncate text for a clean log
        intent: intentResult.intent,
        citations: citations,
        functionsCalled: functionsCalled
    });
    // --- END: ADDED LOGGING ---

    return result;

  } catch (error) {
    console.error(`[Assistant] ERROR: ${error.message}`);
    
    const errorResponse = {
      text: "I encountered an issue processing your request. Please try again in a moment, or feel free to rephrase your question. I'm here to help!",
      intent: 'error',
      citations: { isValid: true, validCitations: [], invalidCitations: [] },
      functionsCalled: [],
      processingTime: Date.now() - startTime
    };

    await logAssistantInteraction({
        sessionId,
        userEmail: userEmail || 'anonymous',
        query,
        intent: 'error',
        responseText: errorResponse.text,
        error: error.message,
        processingTime: errorResponse.processingTime,
    });
    
    // --- START: ADDED ERROR LOGGING  ---
    console.log('Return (Error):', {
        text: errorResponse.text,
        intent: errorResponse.intent,
        citations: errorResponse.citations,
        functionsCalled: errorResponse.functionsCalled
    });
    // --- END: ADDED ERROR LOGGING ---

    return errorResponse;
  }
}