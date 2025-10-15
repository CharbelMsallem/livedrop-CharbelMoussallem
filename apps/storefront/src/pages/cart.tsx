// apps/storefront/src/pages/cart.tsx

import { useCartStore } from '../lib/store';
import { formatCurrency } from '../lib/format';
import { Button } from '../components/atoms/Button';
import { CartItem } from '../components/molecules/CartItem';
import { useRouter } from '../lib/router';

export function CartPage() {
  const { items, total, clearCart } = useCartStore();
  const { navigate } = useRouter();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Cart</h1>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs font-semibold text-gray-600 hover:text-red-500 transition-colors"
          >
            Clear Cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-600 font-semibold mb-2">Your cart is empty.</p>
          <Button onClick={() => navigate('/')} variant="secondary">
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <CartItem key={item._id} item={item} />
          ))}

          <div className="border-t pt-6 mt-6 space-y-3">
            <div className="flex justify-between items-center text-lg font-semibold text-gray-800">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-gray-500 text-right">
              Taxes and shipping will be calculated at checkout.
            </p>
            <Button
              onClick={handleCheckout}
              size="lg"
              className="w-full"
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}