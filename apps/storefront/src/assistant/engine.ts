import { getCustomerOrders, getOrderStatus, searchProducts } from '../lib/api';
import groundTruth from './ground-truth.json';

// --- 1. INTENT CLASSIFICATION ---
type Intent = 'policy_question' | 'order_status' | 'product_search' | 'complaint' | 'chitchat' | 'off_topic' | 'violation';

function classifyIntent(query: string): Intent {
    const q = query.toLowerCase();
    if (q.includes('order') || q.match(/[A-Z0-9]{10,}/)) return 'order_status';
    if (q.includes('search') || q.includes('find') || q.includes('looking for')) return 'product_search';
    if (q.includes('return') || q.includes('shipping') || q.includes('policy') || q.includes('how do i')) return 'policy_question';
    if (q.includes('disappointed') || q.includes('frustrated') || q.includes('not happy')) return 'complaint';
    if (q.includes('hello') || q.includes('thanks') || q.includes('who are you')) return 'chitchat';
    if (q.includes('weather') || q.includes('president')) return 'off_topic';
    return 'policy_question'; // Default fallback
}

// --- 2. FUNCTION REGISTRY ---
const functionRegistry = {
    getOrderStatus: {
        description: "Get the status of a specific order by its ID.",
        execute: async (params: { orderId: string }) => getOrderStatus(params.orderId)
    },
    searchProducts: {
        description: "Search for products based on a query.",
        execute: async (params: { query: string }) => searchProducts(params.query)
    },
    getCustomerOrders: {
        description: "Get all orders for a customer by their email.",
        execute: async (params: { email: string }) => getCustomerOrders(params.email)
    }
};

// --- 3. KNOWLEDGE BASE & CITATION ---
function findRelevantPolicies(query: string): any[] {
    const queryLower = query.toLowerCase();
    const keywords = ['return', 'shipping', 'payment', 'refund', 'policy', 'account', 'security'];
    let matchedCategory = 'general';

    for (const cat of keywords) {
        if (queryLower.includes(cat)) {
            matchedCategory = cat;
            break;
        }
    }
    return groundTruth.filter(p => p.category.toLowerCase().startsWith(matchedCategory));
}

function validateCitations(response: string): { isValid: boolean, validCitations: string[], invalidCitations: string[] } {
    const citations = response.match(/\[Q\d+\]/g) || [];
    const validCitations: string[] = [];
    const invalidCitations: string[] = [];
    const groundTruthIds = groundTruth.map(item => `[${item.qid}]`);

    for (const citation of citations) {
        if (groundTruthIds.includes(citation)) {
            validCitations.push(citation);
        } else {
            invalidCitations.push(citation);
        }
    }
    return { isValid: invalidCitations.length === 0, validCitations, invalidCitations };
}

// --- 4. MAIN PROCESSING PIPELINE ---
export async function processQuery(query: string, userEmail?: string): Promise<any> {
    const intent = classifyIntent(query);
    let responseText = "";
    let functionsCalled: any[] = [];
    let citations: string[] = [];

    switch (intent) {
        case 'order_status':
            const orderId = query.match(/[A-Z0-9]{10,}/)?.[0];
            if (orderId) {
                const status = await functionRegistry.getOrderStatus.execute({ orderId });
                functionsCalled.push({ name: 'getOrderStatus', params: { orderId } });
                if (status) {
                    responseText = `I've looked up order #${orderId}. The current status is: **${status.status}**.`;
                } else {
                    responseText = `I couldn't find an order with the ID #${orderId}. Please double-check the ID.`;
                }
            } else if (userEmail) {
                const orders = await functionRegistry.getCustomerOrders.execute({ email: userEmail });
                functionsCalled.push({ name: 'getCustomerOrders', params: { email: userEmail } });
                if (orders && orders.length > 0) {
                    responseText = `I found ${orders.length} orders for your account. The most recent one has a status of **${orders[0]?.status}**.`;
                } else {
                    responseText = "I couldn't find any orders associated with your email address.";
                }
            } else {
                responseText = "To check an order, please provide an order ID or let me know your email address.";
            }
            break;

        case 'product_search':
            const searchQuery = query.replace(/search for|find/gi, '').trim();
            const products = await functionRegistry.searchProducts.execute({ query: searchQuery });
            functionsCalled.push({ name: 'searchProducts', params: { query: searchQuery } });
            if (products && products.length > 0) {
                responseText = `I found ${products.length} products matching your search. The top result is **${products[0]?.name}**.`;
            } else {
                responseText = `I couldn't find any products matching "${searchQuery}". Try a different search term.`;
            }
            break;

        case 'policy_question':
            const relevantDocs = findRelevantPolicies(query);
            if (relevantDocs.length > 0) {
                const doc = relevantDocs[0];
                responseText = `${doc.answer} [${doc.qid}]`;
                const validation = validateCitations(responseText);
                citations = validation.validCitations;
            } else {
                responseText = "I'm sorry, I couldn't find a specific policy for that. Could you try rephrasing your question?";
            }
            break;
        
        case 'complaint':
            responseText = "I'm very sorry to hear that you're having a frustrating experience. Please let me know more details so I can help resolve this for you.";
            break;

        case 'chitchat':
            responseText = "Hello! I'm Shoplite's support assistant, ready to help with your questions about products, orders, and policies.";
            break;
            
        case 'off_topic':
            responseText = "I can only answer questions related to Shoplite products, orders, and policies. How can I assist you with that?";
            break;
    }

    return {
        text: responseText,
        intent,
        citations,
        functionsCalled
    };
}