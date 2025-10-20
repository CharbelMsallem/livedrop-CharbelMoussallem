
import { useState, useEffect, useRef } from 'react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { processQuery, ChatMessage } from '../../assistant/engine';
import { useUserStore } from '../../lib/store';

interface SupportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const suggestedQuestions = [
  'How long do I have to return products?',
  'What payment methods are supported?',
  'How many orders have I placed?',
  'What did I buy in my last order?',
  'How many products do you have?',
  'What is my total spending?',
];

// Use sessionStorage for chat messages to persist within the tab session but clear on browser close
const SESSION_STORAGE_KEY = 'shoplite-chat-messages';

export function SupportPanel({ isOpen, onClose }: SupportPanelProps) {
  const { customer } = useUserStore(); // Get customer state
  const [query, setQuery] = useState('');
  // Initialize messages from sessionStorage or empty array
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!customer) return []; // If not logged in on initial load, start empty
    const savedMessages = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate a session ID when the panel opens with a logged-in user
  useEffect(() => {
    if (isOpen && customer) {
      // Create a consistent session ID for the backend during this user session
      // Using email ensures it changes if the user logs out and logs in as someone else
      setSessionId(`session_${customer.email}_${Date.now()}`);
      // DO NOT clear messages here - we want persistence while logged in
    }
    // If the panel closes, we don't necessarily need to clear the session ID
    // as it's tied to the user login state now.
  }, [isOpen, customer]);

  // *** EFFECT TO CLEAR MESSAGES ON LOGOUT ***
  useEffect(() => {
    // This effect runs whenever the 'customer' object changes.
    if (!customer) {
      console.log("User logged out, clearing chat messages."); // Debug log
      setMessages([]); // Clear the chat message state
      sessionStorage.removeItem(SESSION_STORAGE_KEY); // Remove from session storage
      setSessionId(''); // Clear the backend session ID
    } else {
        // If user logs IN (customer object appears), try reloading messages from storage
        // This handles cases where they log out then log back in without closing browser tab
        const savedMessages = sessionStorage.getItem(SESSION_STORAGE_KEY);
        setMessages(savedMessages ? JSON.parse(savedMessages) : []);
    }
  }, [customer]); // Depend ONLY on the customer object

  // Save messages to sessionStorage whenever they change AND user is logged in
  useEffect(() => {
    if (customer) { // Only save if logged in
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, customer]); // Depend on messages and customer

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]); // Keep this dependency

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !customer) return; // Ensure customer exists

    // Reset session timeout on user interaction
    useUserStore.getState().resetTimeout();

    const userMessage: ChatMessage = { role: 'user', content: query };
    // Optimistic UI update
    setMessages(prev => [...prev, userMessage]);
    const currentQuery = query;
    setQuery('');
    setLoading(true);

    try {
      // Ensure sessionId is valid
      const currentSessionId = sessionId || `session_${customer.email}_${Date.now()}`;
      if (!sessionId) setSessionId(currentSessionId);

      const responseText = await processQuery(currentQuery, currentSessionId, customer.email);
      const assistantMessage: ChatMessage = { role: 'assistant', content: responseText };
      // Update state with actual response
      setMessages(prev => [...prev.filter(m => m !== userMessage), userMessage, assistantMessage]); // Replace optimistic with actual if needed, or just append
    } catch (error) {
      console.error("Error processing query in SupportPanel:", error);
      const errorMessage: ChatMessage = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' };
      // Update state with error message
       setMessages(prev => [...prev.filter(m => m !== userMessage), userMessage, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (q: string) => {
      setQuery(q);
      // Optional: auto-focus input after setting query
      // document.getElementById('support-input-id')?.focus(); // Needs an ID on the Input component
  };


  // Render null if panel is closed
  if (!isOpen) return null;

  // If panel is open but user got logged out (e.g., timeout), show message or close
  // This depends on desired UX, for now, it will just show empty chat based on the effect
  // if (isOpen && !customer) {
  //    onClose(); // Or show a "Please log in" message inside the panel
  //    return null;
  // }


  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full sm:maxw-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b bg-gradient-to-r from-primary to-secondary text-white shrink-0"> {/* Added shrink-0 */}
          <h2 id="support-title" className="text-lg font-bold">Nio - Support Assistant</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full" aria-label="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Message Display Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
           {messages.length === 0 && !loading && (
             <div className="flex justify-start">
               <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-lg">
                 <p className="text-sm">Hi {customer?.name || 'there'}! 👋 I'm Nio, your Shoplite assistant. How can I help you today?</p> {/* Personalized greeting */}
               </div>
             </div>
           )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-br-lg' : 'bg-gray-100 text-gray-800 rounded-bl-lg'}`}> {/* Adjusted max-width */}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p> {/* Added break-words */}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
                <div className="p-3 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-lg inline-block"> {/* Ensure it doesn't stretch full width */}
                    <div className="flex items-center justify-center gap-1.5 h-5"> {/* Centered dots */}
                        <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-primary rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
          )}
          {/* Invisible div to target for scrolling */}
          <div ref={messagesEndRef} style={{ height: '1px' }} />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 border-t bg-gray-50 shrink-0"> {/* Added shrink-0 */}
           {messages.length <= 1 && ( // Show suggestions only near the start
             <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSuggestionClick(q)}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-full text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-primary" // Adjusted style
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
           )}
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              id="support-input-id" // Added ID for potential focus() call
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your question..."
              disabled={loading || !customer} // Disable if not logged in
              className="flex-1"
              aria-label="Support question input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && query.trim() && customer) { // Check conditions before submitting
                      handleSubmit(e as any);
                    }
                }
              }}
            />
            <Button
              type="submit"
              disabled={loading || !query.trim() || !customer} // Disable if no query or not logged in
              className="!rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0"
              aria-label="Send message"
            >
              {/* Send Icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}