// apps/storefront/src/components/organisms/SupportPanel.tsx

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
  'What is your shipping policy?',
  'How do I track my order status?',
];

export function SupportPanel({ isOpen, onClose }: SupportPanelProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const { customer } = useUserStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate a unique session ID when the panel is opened
  useEffect(() => {
    if (isOpen) {
      setSessionId(`session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
      setMessages([]); // Clear previous conversation
    }
  }, [isOpen]);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !customer) return;

    const userMessage: ChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const response = await processQuery(query, sessionId, customer.email);
      const assistantMessage: ChatMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b bg-gradient-to-r from-primary to-secondary text-white">
          <h2 id="support-title" className="text-lg font-bold">Nio - Support Assistant</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full" aria-label="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Message Display Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-lg' : 'bg-gray-100 text-gray-800 rounded-bl-lg'}`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
                <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-lg">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-primary rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions & Input Form */}
        <div className="p-4 sm:p-6 border-t bg-gray-50">
           {messages.length === 0 && (
             <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">Some things you can ask:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuery(q)}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-full text-xs font-semibold transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
           )}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your question..."
              disabled={loading}
              className="flex-1"
              aria-label="Support question input"
            />
            <Button
              type="submit"
              disabled={loading || !query.trim()}
              className="!rounded-full w-12 h-12 flex items-center justify-center"
              aria-label="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path></svg>
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}