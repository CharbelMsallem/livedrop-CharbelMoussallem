import groundTruth from './ground-truth.json';
import { getOrderStatus } from '../lib/api';

interface QA {
  qid: string;
  category: string;
  question: string;
  answer: string;
}

const ORDER_ID_PATTERN = /[A-Z0-9]{10,}/g;

function extractOrderId(query: string): string | null {
  const matches = query.match(ORDER_ID_PATTERN);
  return matches ? matches[0] : null;
}

function maskPII(text: string): string {
  return text.replace(/([A-Z0-9]{10,})/g, (match) => {
    return '****' + match.slice(-4);
  });
}

function calculateScore(query: string, qa: QA): number {
  const queryLower = query.toLowerCase();
  const questionLower = qa.question.toLowerCase();
  const answerLower = qa.answer.toLowerCase();
  
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  let score = 0;
  queryWords.forEach(word => {
    if (questionLower.includes(word)) score += 3;
    if (answerLower.includes(word)) score += 1;
    if (qa.category.toLowerCase().includes(word)) score += 2;
  });
  
  return score;
}

function findBestMatch(query: string): { qa: QA; score: number } | null {
  let bestMatch: QA | null = null;
  let bestScore = 0;
  
  groundTruth.forEach((qa) => {
    const score = calculateScore(query, qa);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = qa;
    }
  });
  
  const threshold = 3;
  if (bestScore >= threshold && bestMatch) {
    return { qa: bestMatch, score: bestScore };
  }
  
  return null;
}

export async function processQuery(query: string): Promise<string> {
  if (!query || query.trim().length === 0) {
    return "Please ask me a question about our products, orders, or policies.";
  }
  
  const orderId = extractOrderId(query);
  
  if (orderId) {
    const status = getOrderStatus(orderId);
    if (status) {
      const maskedId = maskPII(orderId);
      let response = `Your order (${maskedId}) is currently **${status.status}**. `;
      
      if (status.carrier && status.eta) {
        response += `It's being shipped via ${status.carrier} and expected to arrive by ${status.eta}. `;
      }
      
      response += `[Order Status]`;
      return response;
    }
  }
  
  const match = findBestMatch(query);
  
  if (match) {
    return `${match.qa.answer} [${match.qa.qid}]`;
  }
  
  return "I don't have information about that topic. Please contact our 24/7 support team via live chat, email, or phone for assistance.";
}