// apps/storefront/src/pages/cart.tsx

import { useMemo } from 'react';
import { useCartStore } from '../lib/store';
import { formatCurrency } from '../lib/format';
import { Button } from '../components/atoms/Button';
import { CartItem } from '../components/molecules/CartItem';
import { useRouter } from '../lib/router';

const SHIPPING_FEE = 5.99;
const TAX_RATE = 0.08; // 8%

export function CartPage() {
  const { items, total, clearCart } = useCartStore();
  const { navigate } = useRouter();

  const { tax, finalTotal } = useMemo(() => {
    const tax = total * TAX_RATE;
    const finalTotal = total + tax + SHIPPING_FEE;
    return { tax, finalTotal };
  }, [total]);


  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in text-center">
         <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Button onClick={() => navigate('/')} variant="primary">
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Cart</h1>
        <button
          onClick={clearCart}
          className="text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <CartItem key={item._id} item={item} />
          ))}
        </div>

        <div className="lg:sticky top-24">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold border-b pb-3 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">{formatCurrency(SHIPPING_FEE)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxes</span>
                <span className="font-semibold">{formatCurrency(tax)}</span>
              </div>
            </div>
            <div className="border-t pt-4 mt-4 flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
            <Button
              onClick={handleCheckout}
              size="lg"
              className="w-full mt-6"
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}