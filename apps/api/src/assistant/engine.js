// apps/api/src/assistant/engine.js

import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { getDb } from '../db.js';
import { classifyIntent } from './intent-classifier.js';
import { functionRegistry } from './function-registry.js';

// --- Load Configurations at Startup ---
// Ensure paths are correct relative to the running process CWD
const configPath = path.resolve(process.cwd(), '../../docs/prompts.yaml');
const groundTruthPath = path.resolve(process.cwd(), '../../docs/ground-truth.json');

let promptsConfig;
let groundTruth = [];

try {
    promptsConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
    console.error(`FATAL: Could not load or parse prompts.yaml at ${configPath}`, e);
    process.exit(1); // Exit if core config is missing
}

try {
    groundTruth = JSON.parse(fs.readFileSync(groundTruthPath, 'utf8'));
} catch (e) {
    console.error(`FATAL: Could not load or parse ground-truth.json at ${groundTruthPath}`, e);
    process.exit(1); // Exit if knowledge base is missing
}

// --- Helper Functions ---

/**
 * Finds relevant policy documents from the ground-truth file based on keywords.
 */
function findRelevantPolicies(userQuery) {
  const query = userQuery.toLowerCase();
  // Simple keyword matching for demo purposes
  const categoryKeywords = {
    'returns': ['return', 'refund', 'exchange', 'rma'],
    'shipping': ['shipping', 'delivery', 'track', 'courier', 'carrier'],
    'payment': ['payment', 'pay', 'card', 'paypal', 'credit', 'tax', 'taxes'],
    'security': ['secure', 'privacy', 'password', 'gdpr'],
    'account': ['account', 'profile', 'email', 'register', 'log in', 'login'],
    'products': ['product', 'item', 'search', 'find', 'stock', 'badge'],
    'support': ['support', 'help', 'assistant', 'agent'],
    'cart': ['cart', 'quantity', 'checkout'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => query.includes(kw))) {
      // Return all policies in the matched category for simplicity
      return groundTruth.filter(p => p.category.toLowerCase() === category);
    }
  }
  // If query includes general policy terms but no category matched
  if (['policy', 'how do i', 'how to', 'can i', 'what is'].some(kw => query.includes(kw))) {
    // Return a few common policies as fallback (e.g., return, shipping)
    return groundTruth.filter(p => ['returns', 'shipping'].includes(p.category.toLowerCase()));
  }

  return []; // Return empty if no relevant keywords found
}

/**
 * Constructs the final prompt sent to the LLM, including conversation history.
 */
function constructPrompt(intent, context, query, history) {
    // Ensure promptsConfig and intent exist before accessing properties
    const intentConfig = promptsConfig?.intents?.[intent];
    const behavior = intentConfig?.behavior || "Answer the user's question helpfully.";
    const tone = intentConfig?.tone || "professional";

    const identity = promptsConfig?.identity || { name: "Assistant", role: "Support Agent", personality: "Helpful" };
    const neverSay = promptsConfig?.never_say || ["I'm an AI"];

    // Format the past conversation (last 6 messages)
    const historyString = history.length > 0
      ? history.map(msg => `${msg.role === 'user' ? 'User' : identity.name}: ${msg.content}`).join('\n') // Use assistant name from config
      : "This is the beginning of the conversation.";

    // Simple check for user name mentioned by assistant previously
    let userName = null;
    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg.role === 'assistant') {
             // Look for patterns like "Hello, [Name]!" or "Nice to meet you, [Name]."
            const match = msg.content.match(/(?:Hello|Hi there|Nice to meet you),\s*(\w+)[!.]?/i);
             if (match && match[1]) {
                userName = match[1];
                break;
            }
        }
    }


    // Base system prompt including identity, personality, and rules
    let finalPrompt = `
<|im_start|>system
You are ${identity.name}, a ${identity.role} for Shoplite.
Your personality is: ${identity.personality}.
You must speak naturally as a human support specialist would.
NEVER say the following words or phrases: ${neverSay.join(', ')}.

Your current task based on the user's intent ('${intent}') is: ${behavior}
Maintain a ${tone} tone. Keep your responses concise unless detail is necessary (like for policy questions, product search results, or complex order status).`;

    if (userName) {
      finalPrompt += `\nThe user's name appears to be ${userName}. Use it when addressing them if appropriate (e.g., 'Okay, ${userName}, I looked into that...').`;
    }

    finalPrompt += `

Use the conversation history for context if needed:
---
${historyString}
---

Base your response ONLY on the following context provided for the *newest* user question. Do not use outside knowledge or hallucinate information.
Context for New Question:
---
${context || 'No specific context provided. Rely on conversation history and your general instructions for this intent.'}
---
<|im_end|>
<|im_start|>user
${query}
<|im_end|>
<|im_start|>assistant
`; // Ready for the assistant's response

    return finalPrompt.trim();
}

/**
 * Main orchestrator for the stateful assistant.
 */
export async function runAssistant(query, userEmail, sessionId) {
  const db = getDb(); // Ensure DB is connected
  if (!db) {
      console.error("FATAL: Database not connected in runAssistant.");
      return { text: "I'm sorry, there's a problem connecting to my resources. Please try again later.", intent: "error", functionsCalled: [], citations: { isValid: false, valid: [], invalid: [] } };
  }
  const conversations = db.collection('conversations');

  // 1. Save the user's incoming query.
  try {
      await conversations.insertOne({ sessionId, role: 'user', content: query, createdAt: new Date() });
  } catch (dbError) {
      console.error("Error saving user message to DB:", dbError);
      // Proceed without saving if DB fails, but log it
  }


  // 2. Fetch recent history.
  let history = [];
  try {
      history = await conversations.find({ sessionId }).sort({ createdAt: -1 }).limit(6).toArray();
      history.reverse(); // Chronological order
  } catch (dbError) {
      console.error("Error fetching conversation history:", dbError);
      // Proceed with empty history if DB fails
  }


  // 3. Classify intent and gather specific context.
  const intent = classifyIntent(query);
  let context = ""; // Initialize context as EMPTY
  let functionsCalled = [];
  let policyDocumentsUsed = []; // Store IDs only if intent is policy_question

   // Check if userEmail is required but missing for certain intents
   const requiresEmail = ['order_status', 'last_order', 'total_spendings', 'account_details'];
   if (requiresEmail.includes(intent) && !userEmail && !query.match(/\b[a-f0-9]{24}\b/i)) { // Added check to allow specific order ID lookup without email
       console.warn(`WARN: Intent '${intent}' requires user email, but none provided.`);
       context = `This request requires knowing who the user is, but I don't have their email. Please explain that they need to be 'logged in' (by providing their email on the main page) to get personalized information like order history or account details.`;
       // Optionally override intent to prevent function calls or use a specific prompt
       // intent = 'needs_login'; // If you create a specific prompt for this
   } else {
      // Proceed with gathering context based on intent
      switch (intent) {
        case 'order_status':
          const orderIdMatch = query.match(/\b[a-f0-9]{24}\b/i); // Look for MongoDB ObjectId format
          if (orderIdMatch) {
            const orderId = orderIdMatch[0];
            console.log(`INFO: Attempting to get status for Order ID: ${orderId}`);
            const orderResult = await functionRegistry.execute('getOrderStatus', { orderId });
            context = orderResult && !orderResult.error ? `The user is asking about order ${orderId}. Current status and details: ${JSON.stringify(orderResult, null, 2)}` : `The user asked about order ID ${orderId}, but no matching order was found or there was an error retrieving it. Please inform the user politely.`;
            functionsCalled.push({ name: 'getOrderStatus', params: { orderId } });
          } else if (userEmail) { // Only proceed if email is available
            console.log(`INFO: Attempting to get orders for email: ${userEmail}`);
            const ordersResult = await functionRegistry.execute('getCustomerOrders', { email: userEmail });
            // Check if result is an array before accessing length/slice
            if (Array.isArray(ordersResult)) {
                const totalOrderCount = ordersResult.length;
                const recentOrdersToShow = ordersResult.slice(0, 3);
                context = ordersResult.length > 0
                    ? `The user asks about their orders (no specific ID given). They have a total of ${totalOrderCount} order(s). Details for their ${recentOrdersToShow.length} most recent ones: ${JSON.stringify(recentOrdersToShow, null, 2)}`
                    : `No orders found for email ${userEmail}. Inform the user.`;
            } else {
                 console.error("Error retrieving customer orders, result was not an array:", ordersResult);
                 context = "I encountered an error trying to fetch the order history. Please try again later.";
            }
            functionsCalled.push({ name: 'getCustomerOrders', params: { email: userEmail } });
          } else {
             // This case is handled by the check outside the switch
             console.log("INFO: Order status requested without ID or Email."); // Should have context set already
          }
          break;

        case 'product_count':
            console.log(`INFO: Counting all products.`);
            const countResult = await functionRegistry.execute('countAllProducts');
            context = countResult && typeof countResult.totalProducts === 'number'
                ? `User asked for total product count. The current count is ${countResult.totalProducts}. State this number clearly.`
                : `User asked for the total product count, but I couldn't retrieve it. Apologize and say you can help find specific products instead. Error: ${countResult?.error || 'Unknown'}`;
            functionsCalled.push({ name: 'countAllProducts', params: {} });
            break;

        case 'product_stock':
            // Simple extraction (can be improved with NLP later)
            const productNameMatch = query.match(/(?:stock for|available|how many|in stock)\s+([^\?\.]+)/i);
            const potentialProductName = productNameMatch ? productNameMatch[1].trim() : null;

            if (potentialProductName) {
                console.log(`INFO: Checking stock for product like: "${potentialProductName}"`);
                const stockInfo = await functionRegistry.execute('getProductStockByName', { productName: potentialProductName });
                if (stockInfo && !stockInfo.error) {
                    context = `User asked for stock of "${stockInfo.name || potentialProductName}". The current stock level is ${stockInfo.stock}.`;
                } else if (stockInfo && stockInfo.error) {
                     context = `I encountered an error trying to check stock for "${potentialProductName}". Error: ${stockInfo.error}`;
                } else {
                    context = `I could not find a product closely matching "${potentialProductName}" to check its stock. Suggest searching for it or checking the product page.`;
                }
                functionsCalled.push({ name: 'getProductStockByName', params: { productName: potentialProductName } });
            } else {
                 context = "User asked about stock but didn't clearly specify a product name. Ask which product they're interested in.";
            }
            break;

        case 'total_spendings':
             if (userEmail) { // Only if email available
                console.log(`INFO: Calculating total spendings for ${userEmail}`);
                const spendingInfo = await functionRegistry.execute('getTotalSpendings', { email: userEmail });
                context = spendingInfo && typeof spendingInfo.totalSpent === 'number'
                    ? `User asked for total spendings. Based on their order history, the total amount spent is ${spendingInfo.totalSpent.toFixed(2)} across ${spendingInfo.orderCount} order(s).`
                    : `Could not calculate total spendings for the user. Apologize. Error: ${spendingInfo?.error || 'Unknown'}`;
                functionsCalled.push({ name: 'getTotalSpendings', params: { email: userEmail } });
             } // Error context set outside switch if no email
            break;

        case 'last_order':
            if (userEmail) { // Only if email available
                console.log(`INFO: Retrieving last order for ${userEmail}`);
                const lastOrder = await functionRegistry.execute('getLastOrder', { email: userEmail });
                 context = lastOrder && !lastOrder.error
                    ? `User asked for their last order. Here are the details: ${JSON.stringify(lastOrder, null, 2)}`
                    : `Could not find the last order for this user, or they haven't placed any orders yet. Inform the user. Error: ${lastOrder?.error || 'Not found'}`;
                functionsCalled.push({ name: 'getLastOrder', params: { email: userEmail } });
            } // Error context set outside switch if no email
            break;

        case 'account_details':
             if (userEmail) { // Only if email available
                 console.log(`INFO: Retrieving account details for ${userEmail}`);
                 const details = await functionRegistry.execute('getAccountDetails', { email: userEmail });
                 context = details && !details.error
                    ? `User asked for their account details. Here is the information found: ${JSON.stringify(details, null, 2)}`
                    : `Could not retrieve account details for this user. Apologize. Error: ${details?.error || 'Not found'}`;
                 functionsCalled.push({ name: 'getAccountDetails', params: { email: userEmail } });
             } // Error context set outside switch if no email
             break;

        case 'product_search':
          console.log(`INFO: Searching products for query: ${query}`);
          const productsResult = await functionRegistry.execute('searchProducts', { query });
           if (Array.isArray(productsResult) && productsResult.length > 0) {
              context = `User searched for products matching "${query}". Here are the top results found: ${JSON.stringify(productsResult, null, 2)}`;
           } else if (Array.isArray(productsResult)) { // Empty array
               context = `User searched for products matching "${query}", but no results were found. Suggest they try different keywords or browse categories.`;
           } else { // Error object returned
               console.error("Product search function returned an error:", productsResult?.error);
               context = `I encountered an error while searching for products. Please try again. Error: ${productsResult?.error || 'Unknown'}`;
           }
          functionsCalled.push({ name: 'searchProducts', params: { query } });
          break;

        case 'policy_question':
          console.log(`INFO: Looking for policies related to: ${query}`);
          const policies = findRelevantPolicies(query);
          if (policies.length > 0) {
            // Format context clearly for the LLM
            context = "The user is asking a policy question. Answer based ONLY on the following relevant Shoplite policy document(s). For each piece of information you provide, cite the corresponding Document ID like [PolicyID]:\n---\n" +
                      policies.map(p => `Document ID: [${p.id}]\nQuestion Ref: ${p.question}\nAnswer Content: ${p.answer}`).join('\n---\n');
            policyDocumentsUsed = policies.map(p => p.id); // Store IDs for citation check
            console.log(`INFO: Found ${policies.length} policies for context: ${policyDocumentsUsed.join(', ')}`);
          } else {
            context = "I couldn't find a specific Shoplite policy related to that question in my knowledge base. I can help with general topics like returns, shipping, or payments if you ask about those specifically. How else can I assist?";
            console.log(`INFO: No specific policies found for query.`);
          }
          break;

        case 'complaint':
          context = promptsConfig.intents.complaint.behavior; // Use behavior directly
          break;

        case 'chitchat':
          const nameMatch = query.match(/my name is (\w+)/i);
          const userNameContext = nameMatch ? `The user mentioned their name is ${nameMatch[1]}.` : '';
          context = `${promptsConfig.intents.chitchat.behavior} ${userNameContext}`; // Use behavior + name context
          break;

        case 'off_topic':
        case 'violation':
          // Use behavior directly from prompts.yaml
          context = promptsConfig.intents[intent]?.behavior || "Politely decline to answer.";
          break;

        default: // Fallback if classifier returns unexpected intent
           console.warn(`WARN: Unhandled intent type: ${intent}. Using default behavior.`);
           context = "Answer the user's question helpfully based on the conversation history and general knowledge about Shoplite (if applicable), but prioritize safety and avoid making things up."
      }
  } // End of else block for userEmail check

  // 4. Construct the final prompt.
  const finalPrompt = constructPrompt(intent, context, query, history);

  // 5. Determine max tokens based on intent.
  const maxTokens = ['chitchat', 'complaint', 'off_topic', 'violation', 'product_count', 'product_stock', 'needs_login'] // Added needs_login if used
                    .includes(intent) ? 100 : 300; // Increased default slightly

  console.log(`INFO: Calling LLM. Intent: ${intent}, Max Tokens: ${maxTokens}`);
  // Uncomment for deep debugging:
  // console.log("---- FINAL PROMPT ----\n", finalPrompt, "\n---- END PROMPT ----");

  // Default error response
  let assistantResponse = "I'm sorry, I encountered an issue while processing your request. Could you please try asking again?";
  try {
    const llmResponse = await fetch(process.env.LLM_GENERATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, max_tokens: maxTokens }),
        // Add a timeout (e.g., 30 seconds)
        signal: AbortSignal.timeout(30000) // Requires Node 16+
    });

    if (!llmResponse.ok) {
        const errorBody = await llmResponse.text();
        console.error(`LLM API call failed: ${llmResponse.status} ${llmResponse.statusText}`, errorBody);
        assistantResponse = `I apologize, but I couldn't get a proper response from the core system (Error ${llmResponse.status}). Please try again shortly.`; // More specific error
    } else {
        const llmData = await llmResponse.json();
        console.log("DEBUG: Raw LLM Data Received:", JSON.stringify(llmData, null, 2)); // Keep this for debugging
        assistantResponse = llmData.text || "I apologize, I received an empty response. Could you rephrase your question?";
        console.log("INFO: Received LLM response.");
    }
  } catch (error) {
      if (error.name === 'AbortError') {
          console.error("Error calling LLM API: Request timed out.");
          assistantResponse = "I'm sorry, my connection timed out while trying to get an answer. Please try again.";
      } else {
        console.error("Error calling LLM API:", error);
        assistantResponse = `I'm sorry, there was a network error connecting to the core system. Please check your connection or try again later.`; // More specific network error
      }
  }

  // 6. Save the assistant's response.
   try {
        await conversations.insertOne({ sessionId, role: 'assistant', content: assistantResponse, createdAt: new Date() });
    } catch (dbError) {
        console.error("Error saving assistant message to DB:", dbError);
        // Continue without saving if DB fails
    }

  // 7. Perform citation validation.
  // Regex to find citations like [Policy1.1] or [Shipping3.1] etc.
  const citations = assistantResponse.match(/\[([A-Za-z]+)\d+\.\d+\]/g) || [];
  let citationResult = { isValid: true, valid: [], invalid: [] };
  let finalAssistantResponse = assistantResponse; // Use a new var for potentially cleaned response

  if (intent === 'policy_question') {
      if (policyDocumentsUsed.length > 0 || citations.length > 0) {
          citationResult.valid = citations.filter(c => policyDocumentsUsed.some(docId => `[${docId}]` === c));
          citationResult.invalid = citations.filter(c => !citationResult.valid.includes(c));
          citationResult.isValid = citationResult.invalid.length === 0;
          if (!citationResult.isValid) {
              console.warn("WARN: Invalid citations detected:", citationResult.invalid, "Expected based on context:", policyDocumentsUsed.map(id => `[${id}]`));
              // Optionally add note or remove invalid ones
              // finalAssistantResponse += "\n\n(Note: Some policy references might be inaccurate)";
              finalAssistantResponse = finalAssistantResponse.replace(/\[([A-Za-z]+)\d+\.\d+\]/g, (match) => {
                  return citationResult.valid.includes(match) ? match : ""; // Remove invalid
              }).replace(/\s+\./g, '.'); // Clean up spaces before periods potentially left
          } else if (citations.length > 0) {
              console.log("INFO: Valid citations confirmed:", citationResult.valid);
          }
      }
  } else {
       // If citations appear for non-policy intents, treat as hallucinations
       if (citations.length > 0) {
           console.warn(`WARN: Hallucinated citations found for non-policy intent '${intent}':`, citations);
           citationResult.isValid = false;
           citationResult.invalid = citations;
           finalAssistantResponse = assistantResponse.replace(/\[([A-Za-z]+)\d+\.\d+\]/g, "").trim(); // Remove hallucinated citations
           console.log("INFO: Removed hallucinated citations from response.");
       }
  }

  // 8. Return the final structured result.
  return {
    text: finalAssistantResponse, // Return the potentially cleaned response
    intent,
    functionsCalled,
    citations: citationResult
  };
}