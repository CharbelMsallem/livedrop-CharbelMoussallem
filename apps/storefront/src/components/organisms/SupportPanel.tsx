import { useState, useEffect } from 'react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { processQuery } from '../../assistant/engine';

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
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const result = await processQuery(query);
      setResponse(result);
    } catch (error) {
      setResponse('Sorry, something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    setQuery(question);
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
        <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-primary to-secondary">
          <h2 id="support-title" className="text-xl sm:text-2xl font-bold text-white">Ask Support</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            aria-label="Close support panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
            <p className="text-xs text-teal-900">
              Ask me about our policies, order status, returns, shipping, and more. Also, you can include your order ID for tracking queries ex: [Order #............]
            </p>
          </div>

          {response && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">Response:</p>
              <div className="prose prose-sm max-w-none text-gray-900">
                {response.split(/(\[Q\d+\]|\[Order Status\])/).map((part, i) => {
                  if (part.match(/\[Q\d+\]|\[Order Status\]/)) {
                    return (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-teal-100 text-primary text-xs font-semibold ml-1">
                        {part}
                      </span>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-600 mb-2">Some things you can ask:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestionClick(q)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-semibold transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your question here..."
              disabled={loading}
              aria-label="Support question"
            />
            <Button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Submit Question'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-600 mb-2">Need more help?</p>
            <Button variant="outline" className="w-full" size="sm">
              Chat with a Human Agent
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}