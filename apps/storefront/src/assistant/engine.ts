

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Define the structure of a message in our chat
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Processes a user query by sending it to the stateful backend assistant.
 * @param query - The user's new message.
 * @param sessionId - The unique ID for the current conversation.
 * @param userEmail - The email of the logged-in user.
 * @returns The assistant's response as a string.
 */
export async function processQuery(query: string, sessionId: string, userEmail: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Send the query, sessionId, and userEmail to the backend
      body: JSON.stringify({ query, sessionId, userEmail }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend Error:', errorData);
      return errorData.error || 'The assistant failed to respond. Please try again.';
    }

    const result = await response.json();
    
    // The backend now sends a structured response, we only need the text.
    return result.text;

  } catch (error) {
    console.error('Error processing query:', error);
    return 'Sorry, I was unable to connect to the support service. Please check your connection and try again.';
  }
}