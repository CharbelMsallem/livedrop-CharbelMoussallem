import { useCartStore } from '../lib/store';
import { formatCurrency } from '../lib/format';
import { Button } from '../components/atoms/Button';
import { CartItem } from '../components/molecules/CartItem';
import { Link, useRouter } from '../lib/router';

export function CartPage() {
  const { items, getTotal } = useCartStore();
  const { navigate } = useRouter();

  const subtotal = getTotal();
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <svg
          className="w-32 h-32 mx-auto text-gray-300 mb-6"
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
        <p className="text-gray-600 mb-8">Start shopping to add items to your cart</p>
        <Link to="/">
          <Button size="lg">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : formatCurrency(shipping)}</span>
              </div>
              {shipping === 0 && (
                <p className="text-sm text-green-600 font-semibold">
                  🎉 Free shipping on orders over $100!
                </p>
              )}
              <div className="flex justify-between text-gray-700">
                <span>Tax (8%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg sm:text-xl font-bold">
                <span>Total</span>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <Button
              onClick={() => navigate('/checkout')}
              size="lg"
              className="w-full mb-3"
            >
              Proceed to Checkout
            </Button>

            <Link to="/">
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}