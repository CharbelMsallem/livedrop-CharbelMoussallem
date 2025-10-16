
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { getDb } from '../db.js';
import { classifyIntent } from './intent-classifier.js';
import { functionRegistry } from './function-registry.js';

// --- Load Configurations at Startup ---
const promptsConfig = yaml.load(fs.readFileSync(path.resolve(process.cwd(), '../../docs/prompts.yaml'), 'utf8'));
const groundTruth = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../../docs/ground-truth.json'), 'utf8'));

// --- Helper Functions ---

/**
 * Finds relevant policy documents from the ground-truth file based on keywords.
 */
function findRelevantPolicies(userQuery) {
  const query = userQuery.toLowerCase();
  const categoryKeywords = {
    'returns': ['return', 'refund', 'exchange', 'rma'],
    'shipping': ['shipping', 'delivery', 'track', 'courier'],
    'payment': ['payment', 'pay', 'card', 'paypal', 'credit'],
    'security': ['secure', 'privacy', 'password', 'gdpr'],
    'account': ['account', 'profile', 'email', 'register'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => query.includes(kw))) {
      return groundTruth.filter(p => p.category.toLowerCase() === category);
    }
  }
  return [];
}

/**
 * Constructs the final prompt sent to the LLM, now including conversation history.
 */
function constructPrompt(intent, context, query, history) {
    const behavior = promptsConfig.intents[intent]?.behavior || "Answer the user's question helpfully.";
    const tone = promptsConfig.intents[intent]?.tone || "professional";
    
    // Format the past conversation to provide context to the LLM.
    const historyString = history.length > 0
      ? history.map(msg => `${msg.role === 'user' ? 'User' : 'Nio'}: ${msg.content}`).join('\n')
      : "This is the beginning of the conversation.";

    return `
      You are ${promptsConfig.identity.name}, a ${promptsConfig.identity.role}.
      Your personality is: ${promptsConfig.identity.personality}.
      Your instructions are to be ${tone}.
      Your task is to: ${behavior}.
      NEVER say the following words: ${promptsConfig.never_say.join(', ')}.

      Below is the recent conversation history. Use it for context to provide a relevant and coherent answer to the user's newest question.

      Conversation History:
      ---
      ${historyString}
      ---

      Now, based ONLY on the new context provided below, answer the user's newest question.

      Context for New Question:
      ---
      ${context}
      ---

      User's Newest Question: "${query}"
    `;
}

/**
 * Main orchestrator for the stateful assistant.
 */
export async function runAssistant(query, userEmail, sessionId) {
  const db = getDb();
  const conversations = db.collection('conversations');

  // 1. Save the user's incoming query to the database.
  await conversations.insertOne({
    sessionId,
    role: 'user',
    content: query,
    createdAt: new Date(),
  });

  // 2. Fetch recent history for conversational context.
  const history = await conversations
    .find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(6) // Fetch last 6 messages (3 user, 3 assistant turns)
    .toArray();
  history.reverse(); // Put them in chronological order.

  // 3. Classify intent and gather context for the *new* query.
  const intent = classifyIntent(query);
  let context = "No specific information was found for this query.";
  let functionsCalled = [];

  switch (intent) {
    case 'order_status':
      const orderIdMatch = query.match(/\b[a-f0-9]{24}\b/i);
      if (orderIdMatch) {
        const orderId = orderIdMatch[0];
        const order = await functionRegistry.execute('getOrderStatus', { orderId });
        context = order ? `The user is asking about order ${orderId}. Here is the order data: ${JSON.stringify(order, null, 2)}` : 'The user provided an order ID, but no matching order was found.';
        functionsCalled.push({ name: 'getOrderStatus', params: { orderId } });
      } else if (userEmail) {
        const orders = await functionRegistry.execute('getCustomerOrders', { email: userEmail });
        context = orders.length > 0 ? `The user is asking about their orders. Here is their order history: ${JSON.stringify(orders, null, 2)}` : 'The user asked for their orders, but no orders were found for this email.';
        functionsCalled.push({ name: 'getCustomerOrders', params: { email: userEmail } });
      } else {
        context = "The user is asking for an order status but did not provide an Order ID. Ask them to provide one, mentioning they can find it in their order history.";
      }
      break;

    case 'product_search':
      const products = await functionRegistry.execute('searchProducts', { query });
      context = products.length > 0 ? `The user searched for products. Here are the top results: ${JSON.stringify(products, null, 2)}` : 'The user searched for a product, but no results were found.';
      functionsCalled.push({ name: 'searchProducts', params: { query } });
      break;

    case 'policy_question':
      const policies = findRelevantPolicies(query);
      if (policies.length > 0) {
        context = "The user is asking a policy question. Answer based on the following document(s):\n" + policies.map(p => `[${p.id}] ${p.answer}`).join('\n');
      } else {
        context = "I couldn't find a specific policy related to that question. Politely inform the user and suggest they ask in a different way.";
      }
      break;
    
    case 'complaint':
      context = "The user is expressing a complaint. Acknowledge their frustration with empathy ('I'm very sorry to hear that...') and ask for more specific details so you can help.";
      break;
    case 'chitchat':
      context = "The user is making small talk. Respond with a brief, friendly greeting and gently guide the conversation back to a support topic (e.g., 'How can I help you with Shoplite today?').";
      break;
    case 'off_topic':
    case 'violation':
      context = "The user's query is off-topic or inappropriate. Politely state that you can only assist with Shoplite-related questions and cannot answer this request.";
      break;
  }

  // 4. Construct the final prompt with history, context, and the new query.
  const finalPrompt = constructPrompt(intent, context, query, history);
  
  // 5. Call the LLM endpoint.
  const llmResponse = await fetch(process.env.LLM_GENERATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: finalPrompt, max_tokens: 250 })
  });

  if (!llmResponse.ok) {
      console.error("LLM API call failed:", llmResponse.status, await llmResponse.text());
      throw new Error("Failed to get a response from the AI model.");
  }

  const llmData = await llmResponse.json();
  const assistantResponse = llmData.text || "I'm sorry, I'm having trouble thinking of a response right now.";

  // 6. Save the assistant's response to the database.
  await conversations.insertOne({
    sessionId,
    role: 'assistant',
    content: assistantResponse,
    createdAt: new Date(),
  });

  // 7. Perform basic citation validation and return the final payload.
  const citations = assistantResponse.match(/\[[A-Z]\w*\d+\.\d+\]/g) || [];
  const validCitations = citations.filter(c => groundTruth.some(p => `[${p.id}]` === c));

  return {
    text: assistantResponse,
    intent,
    functionsCalled,
    citations: {
      isValid: validCitations.length === citations.length,
      valid: validCitations,
      invalid: citations.filter(c => !validCitations.includes(c)),
    }
  };
}