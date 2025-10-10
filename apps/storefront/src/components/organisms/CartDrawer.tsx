import { useEffect } from 'react';
import { useCartStore } from '../../lib/store';
import { formatCurrency } from '../../lib/format';
import { Button } from '../atoms/Button';
import { CartItem } from '../molecules/CartItem';
import { useRouter } from '../../lib/router';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, getTotal } = useCartStore();
  const { navigate } = useRouter();
  
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
  
  const handleCheckout = () => {
    onClose();
    navigate('/cart');
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
        className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 id="cart-title" className="text-xl sm:text-2xl font-bold">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-24 h-24 mx-auto text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            items.map((item) => <CartItem key={item.id} item={item} />)
          )}
        </div>
        
        {items.length > 0 && (
          <div className="border-t p-4 sm:p-6 space-y-4 bg-gray-50">
            <div className="flex justify-between items-center text-lg sm:text-xl font-bold">
              <span>Total</span>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {formatCurrency(getTotal())}
              </span>
            </div>
            <Button onClick={handleCheckout} className="w-full" size="lg">
              Proceed to Checkout
            </Button>
          </div>
        )}
      </div>
    </>
  );
}