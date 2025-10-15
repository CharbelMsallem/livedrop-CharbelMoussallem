import { useState } from 'react';
import { Input } from './atoms/Input';
import { Button } from './atoms/Button';
import { getCustomerByEmail, Customer } from '../lib/api';

interface UserLoginProps {
    onLoginSuccess: (customer: Customer) => void;
}

export function UserLogin({ onLoginSuccess }: UserLoginProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    try {
      const customer = await getCustomerByEmail(email);
      if (customer) {
        onLoginSuccess(customer);
      } else {
        setError('No customer found with that email. (Try demo@gmail.com)');
      }
    } catch (err) {
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm m-auto text-center animate-fade-in">
        <h2 className="text-2xl font-bold mb-2">Welcome to Shoplite</h2>
        <p className="text-gray-600 mb-6">Please enter your email to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            aria-label="Email address"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
