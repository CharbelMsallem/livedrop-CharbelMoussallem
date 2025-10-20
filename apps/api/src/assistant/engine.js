// apps/api/src/assistant/engine.js

import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { classifyIntent } from './intent-classifier.js';
import { functionRegistry } from './function-registry.js';
import { getDb } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let promptsConfig;
let knowledgeBase = [];

try {
  const promptsFilePath = path.join(__dirname, '../../../docs/prompts.yaml');
  promptsConfig = yaml.load(fs.readFileSync(promptsFilePath, 'utf8'));
  console.log("Prompts configuration loaded successfully.");
} catch (e) {
  console.error("Failed to load prompts.yaml:", e);
  promptsConfig = {};
}

try {
  const kbFilePath = path.join(__dirname, '../../../docs/ground-truth.json');
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


function getConversationHistory(sessionId) {
    return conversationHistories[sessionId] || [];
}

function addToConversationHistory(sessionId, role, content, intent) {
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
    const history = getConversationHistory(sessionId);
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

async function getCustomerByEmail(email) {
    if (!email) return null;
    const db = getDb();
    return await db.collection('customers').findOne({ email: email });
}

function findRelevantPolicies(query) {
  const lowerQuery = query.toLowerCase();
  const keywords = {
    Account: ['account', 'login', 'password', 'email', 'profile'],
    Orders: ['order', 'purchase', 'history', 'past order'],
    Shipping: ['ship', 'delivery', 'carrier', 'cost', 'fee', 'free shipping'],
    Returns: ['return', 'refund', 'exchange', 'money back', 'rma'],
    Payment: ['payment', 'pay', 'card', 'tax', 'billing'],
    Products: ['product', 'item', 'search', 'find', 'catalog', 'stock', 'badge', 'quantity'],
    Support: ['support', 'help', 'assistant', 'contact'],
    Security: ['secure', 'security', 'safe', 'privacy'],
    Cart: ['cart', 'basket', 'checkout', 'add item', 'remove item'],
  };

  let matchedCategory = null;
  for (const [category, kws] of Object.entries(keywords)) {
    if (kws.some(kw => lowerQuery.includes(kw))) {
      matchedCategory = category;
      break;
    }
  }

  if (matchedCategory) {
    return knowledgeBase.filter(doc => doc.category.toLowerCase() === category.toLowerCase());
  }
  return [];
}


function validateCitations(responseText) {
  const citations = [...responseText.matchAll(/\[([a-zA-Z]+\d+\.\d+)\]/g)].map(m => m[1]);
  const validCitations = [];
  const invalidCitations = [];

  for (const citation of citations) {
    if (knowledgeBase.some(doc => doc.id === citation)) {
      validCitations.push(citation);
    } else {
      invalidCitations.push(citation);
    }
  }
  return { isValid: invalidCitations.length === 0, validCitations, invalidCitations };
}

async function callLLM(prompt) {
    if (!LLM_GENERATE_URL) throw new Error("LLM endpoint URL is not configured.");
    console.log(`[LLM Call] Sending prompt (first 100 chars): ${prompt.substring(0, 100)}...`);
    try {
        const response = await fetch(LLM_GENERATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt, max_tokens: 300 }),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`LLM API request failed with status ${response.status}: ${errorBody}`);
        }
        const result = await response.json();
        return result.text || '';
    } catch (error) {
        console.error(`[LLM Call] Network or fetch error: ${error.message}`);
        throw new Error(`Failed to communicate with the LLM service: ${error.message}`);
    }
}

function buildPrompt(intentConfig, context, query, history) {
  const { identity, response_guidelines, never_say } = promptsConfig;
  const { name, role, personality } = identity;
  const { goal, context_guidelines = [], response_format } = intentConfig;

  let prompt = `<|im_start|>system
You are ${name}, a ${role}.
Personality: ${personality}
Your goal is to: ${goal || 'assist the user with their Shoplite query.'}

General Guidelines:
${response_guidelines.map(g => `- ${g}`).join('\n')}
${context_guidelines.map(g => `- ${g}`).join('\n')}

CRITICAL: NEVER say any of the following:
${never_say.map(phrase => `- "${phrase}"`).join('\n')}
Speak naturally as a human. Do not mention being an AI.

Response Format Guideline: ${response_format || 'Provide a helpful answer.'}
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

export async function runAssistant(query, userEmail, sessionId) {
  console.log(`[Assistant Engine] Processing query for session ${sessionId}: "${query}"`);
  const startTime = Date.now();
  const history = getConversationHistory(sessionId);
  let intentResult;
  let context = '';
  let responseText = '';
  let functionsCalled = [];
  let citations = { isValid: true, validCitations: [], invalidCitations: [] };
  let customer = null;

  try {
     customer = await getCustomerByEmail(userEmail);
     if (!customer) console.warn(`[Assistant Engine] Customer not found for email: ${userEmail}`);

    intentResult = classifyIntent(query);
    const isFragment = query.split(' ').length <= 4 && (query.toLowerCase().startsWith('and ') || query.toLowerCase().startsWith('what about '));
    const lastIntent = getLastUserIntent(sessionId);

    if (isFragment && lastIntent && lastIntent === 'product_search') {
        console.log(`[Assistant Engine] Follow-up detected. Reusing last intent: ${lastIntent}`);
        intentResult.intent = 'product_search';
        intentResult.searchTerm = query.replace(/and |what about |the /gi, '').trim();
    }

    const intent = intentResult.intent;
    console.log(`[Assistant Engine] Classified intent: ${intent}`);

    let intentConfig = promptsConfig.intents[intent] || promptsConfig.intents['off_topic'];
    let functionResult = null;

    switch (intent) {
      case 'policy_question':
        const policies = findRelevantPolicies(query);
        context = policies.length > 0
          ? policies.map(p => `Policy ID: ${p.id}\nQuestion: ${p.question}\nAnswer: ${p.answer}`).join('\n\n---\n\n')
          : 'No relevant policies found in the knowledge base.';
        break;

      case 'order_count':
           if (customer) {
               functionResult = await functionRegistry.execute('countCustomerOrders', { customerId: customer._id.toString() });
               functionsCalled.push({ name: 'countCustomerOrders', args: { customerId: customer._id.toString() } });
               context = `The customer has placed ${functionResult.orderCount} orders.`;
           } else {
               context = "I need to know who you are to count your orders. Please log in.";
           }
           break;

      case 'order_status':
        if (intentResult.extractedOrderId) {
            functionResult = await functionRegistry.execute('getOrderStatus', { orderId: intentResult.extractedOrderId });
            functionsCalled.push({ name: 'getOrderStatus', args: { orderId: intentResult.extractedOrderId } });
            context = functionResult ? `Order Details: ${JSON.stringify(functionResult, null, 2)}` : 'Order not found.';
        } else {
            context = "Could not find an order ID in your query. Please provide the order ID.";
        }
        break;

      case 'product_search':
        if (intentResult.searchTerm) {
          functionResult = await functionRegistry.execute('searchProducts', { query: intentResult.searchTerm, limit: 2 });
          functionsCalled.push({ name: 'searchProducts', args: { query: intentResult.searchTerm, limit: 2 } });
          context = functionResult && functionResult.length > 0
            ? `Search Results:\n${JSON.stringify(functionResult, null, 2)}`
            : 'No products found matching that search term.';
        } else {
            context = "What product are you looking for?";
        }
        break;

       case 'last_order':
           if (customer) {
               functionResult = await functionRegistry.execute('getCustomerOrders', { customerId: customer._id.toString(), limit: 1 });
               functionsCalled.push({ name: 'getCustomerOrders', args: { customerId: customer._id.toString(), limit: 1 } });
               context = functionResult && functionResult.length > 0 ? `Most Recent Order: ${JSON.stringify(functionResult[0], null, 2)}` : 'Could not find any past orders for you.';
           } else {
               context = "I need to know who you are to find your last order. Are you logged in?";
           }
           break;

       case 'product_count':
             functionResult = await functionRegistry.execute('getProductCount', {});
             functionsCalled.push({ name: 'getProductCount', args: {} });
             context = `Total product count: ${functionResult}`;
             break;

        case 'total_spendings':
             if (customer) {
                 functionResult = await functionRegistry.execute('getTotalSpendings', { customerId: customer._id.toString() });
                 functionsCalled.push({ name: 'getTotalSpendings', args: { customerId: customer._id.toString() } });
                 context = `Customer Spending Summary: Total Spent: ${functionResult.totalSpent}, Order Count: ${functionResult.orderCount}`;
             } else {
                 context = "I need to know who you are to calculate your total spending. Are you logged in?";
             }
             break;

      default:
        break;
    }

    const prompt = buildPrompt(intentConfig, context, query, history);
    responseText = await callLLM(prompt);

    if (responseText.toLowerCase().startsWith('answer:')) {
      responseText = responseText.substring('answer:'.length).trim();
    }
    if (intent !== 'policy_question' && responseText.includes('\nSources:')) {
      responseText = responseText.split('\nSources:')[0].trim();
    }

    if (intent === 'policy_question') {
      citations = validateCitations(responseText);
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Log the interaction for analytics
    await logAssistantInteraction({
        sessionId,
        userEmail,
        query,
        intent: intentResult.intent,
        responseText,
        functionsCalled,
        processingTime,
        citations,
    });


    addToConversationHistory(sessionId, 'user', query, intent);
    addToConversationHistory(sessionId, 'assistant', responseText);

    console.log(`[Assistant Engine] Query processed in ${processingTime}ms`);

    return {
      text: responseText,
      intent: intentResult.intent,
      citations,
      functionsCalled,
      processingTime,
    };

  } catch (error) {
    console.error(`[Assistant Engine] Error processing query: ${error.message}`, error.stack);
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Also log errors
    await logAssistantInteraction({
        sessionId,
        userEmail,
        query,
        intent: intentResult?.intent || 'error',
        responseText: "An internal error occurred.",
        error: error.message,
        processingTime,
    });

    return {
      text: "I encountered an issue trying to process your request. Please try again shortly.",
      intent: 'error',
    };
  }
}

