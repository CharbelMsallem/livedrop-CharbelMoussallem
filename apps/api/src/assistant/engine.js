// apps/api/src/assistant/engine.js

import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { classifyIntent } from './intent-classifier.js';
import { functionRegistry } from './function-registry.js';
import { getDb } from '../db.js';

// Helper function to format currency
const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let promptsConfig;
let knowledgeBase = [];

// Load prompts.yaml configuration
try {
  const promptsFilePath = path.join(__dirname, '../../../../docs/prompts.yaml');
  promptsConfig = yaml.load(fs.readFileSync(promptsFilePath, 'utf8'));
  console.log("Prompts configuration loaded successfully.");
} catch (e) {
  console.error("Failed to load prompts.yaml:", e);
  promptsConfig = {}; // Fallback
}

// Load ground-truth.json knowledge base
try {
  const kbFilePath = path.join(__dirname, '../../../../docs/ground-truth.json');
  knowledgeBase = JSON.parse(fs.readFileSync(kbFilePath, 'utf8'));
  console.log(`Knowledge base loaded successfully with ${knowledgeBase.length} policies.`);
} catch (e) {
  console.error("Failed to load ground-truth.json:", e);
  knowledgeBase = []; // Fallback
}

// Check for LLM endpoint URL
const LLM_GENERATE_URL = process.env.LLM_GENERATE_URL;
if (!LLM_GENERATE_URL) {
    console.warn("LLM_GENERATE_URL environment variable is not set. Assistant LLM calls will fail.");
}

const conversationHistories = {};
const MAX_HISTORY_LENGTH = 6; // Keep last 3 user/assistant pairs

// --- Logging function for Analytics ---
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

// --- Conversation History Management ---
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

function getLastUserIntent(sessionId) {
    if (!sessionId || !conversationHistories[sessionId]) return null;
    const history = conversationHistories[sessionId];
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'user' && history[i].intent) {
            return history[i].intent;
        }
    }
    return null;
}

function formatHistoryForPrompt(history) {
    return history.map(msg => `<|im_start|>${msg.role}\n${msg.content}<|im_end|>`).join('\n');
}

// --- Customer Data ---
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

// --- Knowledge Base Retrieval ---
function findRelevantPolicies(query) {
  const lowerQuery = query.toLowerCase();
  const keywords = {
    Account: ['account', 'login', 'password', 'email', 'profile', 'sign in', 'register'],
    Orders: ['order', 'purchase', 'history', 'past order', 'track'],
    Shipping: ['ship', 'delivery', 'carrier', 'cost', 'fee', 'free shipping', 'options'],
    Returns: ['return', 'refund', 'exchange', 'money back', 'rma', 'policy'],
    Payment: ['payment', 'pay', 'card', 'tax', 'billing', 'charge', 'method'],
    Products: ['product', 'item', 'search', 'find', 'catalog', 'stock', 'badge', 'quantity', 'available'],
    Support: ['support', 'help', 'assistant', 'contact', 'agent'],
    Security: ['secure', 'security', 'safe', 'privacy', 'guarantee'],
    Cart: ['cart', 'basket', 'checkout', 'add item', 'remove item', 'update quantity'],
  };

  let matchedCategory = null;
  for (const [category, kws] of Object.entries(keywords)) {
    if (kws.some(kw => lowerQuery.includes(kw))) {
      if (category === 'Returns' || !lowerQuery.includes('policy') || lowerQuery.includes('return policy')) {
         matchedCategory = category;
         break;
      }
      if (!matchedCategory) matchedCategory = category;
    }
  }

  if (matchedCategory) {
    return knowledgeBase.filter(doc => doc.category.toLowerCase() === matchedCategory.toLowerCase());
  }
  if (lowerQuery.includes('policy')) {
      return knowledgeBase;
  }
  return [];
}

// --- Citation Validation ---
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

// --- LLM Interaction ---
async function callLLM(prompt) {
    if (!LLM_GENERATE_URL) throw new Error("LLM endpoint URL is not configured.");
    console.log(`[LLM Call] Sending prompt (first 150 chars): ${prompt.substring(0, 150)}...`);
    try {
        const response = await fetch(LLM_GENERATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt, max_tokens: 350 }),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[LLM Call] API Error ${response.status}: ${errorBody}`);
            throw new Error(`LLM API request failed with status ${response.status}`);
        }
        const result = await response.json();
        const generatedText = result.text || '';
        console.log(`[LLM Call] Received response (first 100 chars): ${generatedText.substring(0, 100)}...`);
        return generatedText;
    } catch (error) {
        console.error(`[LLM Call] Network or fetch error: ${error.message}`);
        throw new Error(`Failed to communicate with the LLM service: ${error.message}`);
    }
}

// Builds the final prompt string for the LLM
function buildPrompt(intent, intentConfig, context, query, history) {
  // Ensure promptsConfig and its properties are defined
  const identity = promptsConfig?.identity || { name: "Support Assistant", role: "assistant", personality: "Helpful" };
  const response_guidelines = promptsConfig?.response_guidelines || ["Be helpful."];
  const never_say = promptsConfig?.never_say || ["I am an AI"];

  // Ensure intentConfig exists and has properties
  const { name = identity.name, role = identity.role, personality = identity.personality } = identity;
  const { goal = 'assist the user', behavior = 'Respond helpfully', context_guidelines = [], response_format = 'Provide a helpful answer.', tone = 'Polite' } = intentConfig || {};

  let prompt = `<|im_start|>system
You are ${name}, a ${role} for Shoplite.
Personality: ${personality}
Your goal is to: ${goal}

General Guidelines:
${response_guidelines.map(g => `- ${g}`).join('\n')}
${context_guidelines.map(g => `- ${g}`).join('\n')}

Intent-Specific Behavior (${intent}): ${behavior}
Tone: ${tone}

CRITICAL: NEVER say any of the following:
${never_say.map(phrase => `- "${phrase}"`).join('\n')}
Speak naturally as a human. Do not mention being an AI, model, or bot.

${intent === 'off_topic' ? "CRITICAL REINFORCEMENT: If the intent is 'off_topic', ONLY output the exact refusal sentence specified in the behavior. No extra words or apologies." : ''}
${intent === 'policy_question' ? "CRITICAL REINFORCEMENT: For policy questions, include the citation exactly like [PolicyID] at the end, using the ID from the CONTEXT." : ''}
${intent === 'product_search' ? "CRITICAL REINFORCEMENT: For product searches, base your answer *EXCLUSIVELY* on the 'Search Results' context provided. Do NOT mention products not listed there." : ''}
${['order_status', 'last_order'].includes(intent) ? "CRITICAL REINFORCEMENT: For order details, base your answer *ONLY* on the context provided." : ''}

Response Format Guideline: ${response_format}
<|im_end|>\n`;

    if (history && history.length > 0) {
        prompt += formatHistoryForPrompt(history) + '\n';
    }

    prompt += `<|im_start|>user\n`;
    if (context) {
        prompt += `CONTEXT:\n${context}\n\n`;
    }
    prompt += `QUESTION:\n${query}\n<|im_end|>\n<|im_start|>assistant\n`;
    return prompt.trim();
}

// Formats order details into a readable context string
function formatOrderContext(orderData, contextType = 'Order Details') {
    if (!orderData) return 'Order Context:\nOrder not found.'; // Ensure context label
    let context = `${contextType}:\n`;
    context += `Order ID: ${orderData._id}\n`;
    context += `Status: ${orderData.status}\n`;
    context += `Placed On: ${new Date(orderData.createdAt).toLocaleDateString()}\n`;
    if (orderData.carrier) context += `Carrier: ${orderData.carrier}\n`;
    if (orderData.estimatedDelivery) context += `Estimated Delivery: ${new Date(orderData.estimatedDelivery).toLocaleDateString()}\n`;
    context += `Total: ${formatCurrency(orderData.total)}\n`;
    context += `Items:\n${orderData.items.map(item => `  - ${item.name} (Qty: ${item.quantity})`).join('\n')}`;
    return context;
}

// --- Main Assistant Logic ---
export async function runAssistant(query, userEmail, sessionId) {
  console.log(`[Assistant Engine] Processing query for session ${sessionId}: "${query}"`);
  const startTime = Date.now();
  const history = getConversationHistory(sessionId);
  let intentResult = { intent: 'off_topic', extractedOrderId: null, searchTerm: null };
  let context = '';
  let responseText = '';
  let functionsCalled = [];
  let citations = { isValid: true, validCitations: [], invalidCitations: [] };
  let customer = null;
  let intentConfig = promptsConfig?.intents?.['off_topic']; // Default safe access
  let finalIntent = 'off_topic'; // Keep track of the final determined intent

  try {
     if (userEmail) {
         customer = await getCustomerByEmail(userEmail);
         if (!customer) console.warn(`[Assistant Engine] Customer not found for email: ${userEmail}`);
     }

    // Classify intent
    intentResult = classifyIntent(query);
    const isFragment = query.split(' ').length <= 4 && (query.toLowerCase().startsWith('and ') || query.toLowerCase().startsWith('what about '));
    const lastIntent = getLastUserIntent(sessionId);

    // Handle potential follow-up for product search
    if (isFragment && lastIntent && lastIntent === 'product_search') {
        console.log(`[Assistant Engine] Follow-up detected. Reusing last intent: ${lastIntent}`);
        intentResult.intent = 'product_search';
        intentResult.searchTerm = query.replace(/^(and|what about|the|a|an)\s+/i, '').trim();
    }

    finalIntent = intentResult.intent; // Store the initial intent
    console.log(`[Assistant Engine] Classified intent: ${finalIntent}`);
    intentConfig = promptsConfig?.intents?.[finalIntent] || promptsConfig?.intents?.['off_topic'];

    if (!intentConfig) {
        console.error(`[Assistant Engine] FATAL: Intent configuration missing for intent '${finalIntent}' or default 'off_topic'.`);
        throw new Error(`Configuration missing for intent: ${finalIntent}`);
    }


    let functionResult = null;

    // --- Intent-based context building and function calling ---
    switch (finalIntent) {
      case 'policy_question':
        const policies = findRelevantPolicies(query);
        context = policies.length > 0
          ? policies.map(p => `Policy ID: ${p.id}\nQuestion: ${p.question}\nAnswer: ${p.answer}`).join('\n\n---\n\n')
          : 'Context:\nNo relevant policies found in the knowledge base.';
        break;

      case 'order_count':
           if (customer) {
               functionResult = await functionRegistry.execute('countCustomerOrders', { customerId: customer._id.toString() });
               functionsCalled.push({ name: 'countCustomerOrders', args: { customerId: customer._id.toString() } });
               context = `Order Count Context:\nThe customer has placed ${functionResult.orderCount} orders.`;
           } else {
               context = "User Context:\nThe user is not identified. Ask them to provide their email or log in.";
               intentConfig = { ...intentConfig, behavior: "Politely inform the user you need their identity (email/login) to count their orders." }; // Modify behavior
           }
           break;

      case 'order_status':
        if (intentResult.extractedOrderId) {
            functionResult = await functionRegistry.execute('getOrderStatus', { orderId: intentResult.extractedOrderId });
            functionsCalled.push({ name: 'getOrderStatus', args: { orderId: intentResult.extractedOrderId } });
            context = formatOrderContext(functionResult, 'Order Details');
        } else if (customer) {
            context = "User Context:\nNo order ID was provided. The user is logged in.";
            intentConfig = { ...intentConfig, behavior: "Ask the user to provide the specific order ID they want to check, or ask if they meant their most recent order.", tone: "Helpful and clarifying" };
        } else {
            context = "User Context:\nNo order ID provided, and user is not identified.";
            intentConfig = { ...intentConfig, behavior: "Politely ask the user for the order ID and mention they might need to log in.", tone: "Helpful and clarifying"};
        }
        break;

      case 'product_search':
        if (intentResult.searchTerm) {
          functionResult = await functionRegistry.execute('searchProducts', { query: intentResult.searchTerm, limit: 2 });
          functionsCalled.push({ name: 'searchProducts', args: { query: intentResult.searchTerm, limit: 2 } });
          // Ensure the context clearly states if nothing was found
          context = functionResult && functionResult.length > 0
            ? `Search Results:\n${JSON.stringify(functionResult.map(p => ({ name: p.name, price: formatCurrency(p.price) })), null, 2)}` // Include formatted price
            : 'Search Results:\nNo products found matching that search term.';
          console.log(`[Assistant Engine] Product Search Context: ${context}`); // Log context
        } else {
            context = "Query Context:\nThe user wants to search for products but didn't specify what.";
            intentConfig = { ...intentConfig, behavior: "Ask the user what product they are looking for.", tone: "Helpful and clarifying" };
        }
        break;

       case 'last_order':
           if (customer) {
               functionResult = await functionRegistry.execute('getCustomerOrders', { customerId: customer._id.toString(), limit: 1 });
               functionsCalled.push({ name: 'getCustomerOrders', args: { customerId: customer._id.toString(), limit: 1 } });
               context = functionResult && functionResult.length > 0
                   ? formatOrderContext(functionResult[0], 'Most Recent Order')
                   : 'Order Context:\nNo past orders found for this customer.';
           } else {
               context = "User Context:\nThe user is not identified. Ask them to provide their email or log in.";
               intentConfig = { ...intentConfig, behavior: "Politely inform the user you need their identity (email/login) to find their last order." };
           }
           break;

       case 'product_count':
             functionResult = await functionRegistry.execute('getProductCount', {});
             functionsCalled.push({ name: 'getProductCount', args: {} });
             context = `Product Count Context:\nTotal product count is ${functionResult}.`;
             break;

        case 'total_spendings':
             if (customer) {
                 functionResult = await functionRegistry.execute('getTotalSpendings', { customerId: customer._id.toString() });
                 functionsCalled.push({ name: 'getTotalSpendings', args: { customerId: customer._id.toString() } });
                 context = `Customer Spending Summary Context:\nTotal Spent: ${formatCurrency(functionResult.totalSpent)}, Order Count: ${functionResult.orderCount}`;
             } else {
                 context = "User Context:\nThe user is not identified. Ask them to provide their email or log in.";
                 intentConfig = { ...intentConfig, behavior: "Politely inform the user you need their identity (email/login) to calculate their total spending." };
             }
             break;

      // Handle intents that don't need specific context/function calls
      case 'chitchat':
      case 'complaint':
      case 'violation':
      case 'off_topic':
      default:
        // No specific context needed beyond history and query
        break;
    }

    // Build and call LLM
    const prompt = buildPrompt(finalIntent, intentConfig, context, query, history);
    responseText = await callLLM(prompt);

    // --- Post-processing and Safeguards ---

    // ** HARDCODED SAFEGUARD FOR OFF-TOPIC **
    if (finalIntent === 'off_topic') {
        const expectedRefusal = "I can only assist with questions about Shoplite products, orders, and our store policies. I cannot provide information on other topics.";
        if (responseText !== expectedRefusal) {
            console.warn(`[Assistant Engine] LLM deviated from off_topic instruction. Overwriting response.`);
            responseText = expectedRefusal;
        }
    }

    // Clean up "Answer:" prefix if present
    if (responseText.toLowerCase().startsWith('answer:')) {
      responseText = responseText.substring('answer:'.length).trim();
    }
    // Remove Sources line if not a policy question
    if (finalIntent !== 'policy_question' && responseText.includes('\nSources:')) {
      responseText = responseText.split('\nSources:')[0].trim();
    }

    // Validate citations only for policy questions
    if (finalIntent === 'policy_question') {
      citations = validateCitations(responseText);
      if (!citations.isValid) {
          console.warn(`[Assistant Engine] Invalid citations detected for query "${query}": ${citations.invalidCitations.join(', ')}`);
      }
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Log interaction
    await logAssistantInteraction({
        sessionId,
        userEmail: userEmail || 'anonymous',
        query,
        intent: finalIntent, // Log the final intent used
        responseText,
        functionsCalled: functionsCalled.length > 0 ? functionsCalled : undefined,
        contextProvided: context || undefined,
        processingTime,
        citations: finalIntent === 'policy_question' ? citations : undefined,
        llmPromptLength: prompt.length,
    });

    // Update conversation history
    addToConversationHistory(sessionId, 'user', query, finalIntent);
    addToConversationHistory(sessionId, 'assistant', responseText);

    console.log(`[Assistant Engine] Query processed in ${processingTime}ms. Intent: ${finalIntent}. Functions Called: ${functionsCalled.length}.`);

    return {
      text: responseText,
      intent: finalIntent,
      citations,
      functionsCalled,
      processingTime,
    };

  } catch (error) {
    console.error(`[Assistant Engine] CRITICAL ERROR processing query "${query}" for session ${sessionId}: ${error.message}`, error.stack);
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Log error
    await logAssistantInteraction({
        sessionId,
        userEmail: userEmail || 'anonymous',
        query,
        intent: finalIntent || 'error', // Use determined intent if available
        responseText: "An internal error occurred preventing a response.",
        error: error.message,
        processingTime,
        contextProvided: context || undefined,
        llmPromptLength: (typeof prompt !== 'undefined' && prompt) ? prompt.length : 0,
    });

    // Update history even on error
    addToConversationHistory(sessionId, 'user', query, finalIntent || 'error');
    addToConversationHistory(sessionId, 'assistant', "I encountered an issue trying to process your request. Please try again shortly.");

    return {
      text: "I encountered an issue trying to process your request. Please try again shortly.",
      intent: 'error',
      citations: { isValid: true, validCitations: [], invalidCitations: [] },
      functionsCalled: [],
      processingTime
    };
  }
}