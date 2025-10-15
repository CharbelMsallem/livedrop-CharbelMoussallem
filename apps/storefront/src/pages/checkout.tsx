// apps/storefront/src/pages/checkout.tsx

import { useState, useEffect } from 'react'; // Import useEffect
import { useCartStore } from '../lib/store';
import { useUserStore } from '../lib/store';
import { placeOrder } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { Button } from '../components/atoms/Button';
import { useRouter } from '../lib/router';

export function CheckoutPage() {
  const { items, total, clearCart } = useCartStore();
  const { customer } = useUserStore();
  const { navigate } = useRouter();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to home if the user is not logged in
  useEffect(() => {
    if (!customer) {
      navigate('/');
    }
  }, [customer, navigate]);

  const handlePlaceOrder = async () => {
    if (!customer) {
      setError("You must be logged in to place an order.");
      return;
    }

    setIsPlacingOrder(true);
    setError(null);
    try {
      const order = await placeOrder(customer._id, items, total);
      clearCart();
      // Use the query parameter format for navigation
      navigate(`/order-status?orderId=${order._id}`);
    } catch (err) {
      setError("Failed to place order. Please try again.");
      console.error(err);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-gray-600 mb-4">You can't checkout without any items.</p>
        <Button onClick={() => navigate('/')}>Go Shopping</Button>
      </div>
    );
  }

  // Render nothing until we confirm the customer exists
  if (!customer) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            {items.map(item => (
              <div key={item._id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-4 mt-4 flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="font-semibold">{customer.name}</p>
            <p className="text-sm text-gray-600">{customer.email}</p>
            <p className="text-sm text-gray-600">{customer.address}</p>
          </div>
          <Button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            size="lg"
            className="w-full mt-6"
          >
            {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
          </Button>
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}