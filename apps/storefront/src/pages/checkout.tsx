// apps/storefront/src/pages/checkout.tsx

import { useState, useEffect, useMemo } from 'react';
import { useCartStore } from '../lib/store';
import { useUserStore } from '../lib/store';
import { placeOrder } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { Button } from '../components/atoms/Button';
import { useRouter } from '../lib/router';

const SHIPPING_FEE = 5.99;
const TAX_RATE = 0.08; // 8%

export function CheckoutPage() {
  const { items, total, clearCart } = useCartStore();
  const { customer } = useUserStore();
  const { navigate } = useRouter();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) {
      navigate('/');
    }
  }, [customer, navigate]);

  const { tax, finalTotal } = useMemo(() => {
    const tax = total * TAX_RATE;
    const finalTotal = total + tax + SHIPPING_FEE;
    return { tax, finalTotal };
  }, [total]);


  const handlePlaceOrder = async () => {
    if (!customer) {
      setError("You must be logged in to place an order.");
      return;
    }

    setIsPlacingOrder(true);
    setError(null);
    try {
      // Use the finalTotal when placing the order
      const order = await placeOrder(customer._id, items, finalTotal);
      clearCart();
      navigate(`/order-status?orderId=${order._id}`);
    } catch (err) {
      setError("Failed to place order. Please try again.");
      console.error(err);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0 && !isPlacingOrder) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-gray-600 mb-4">You can't checkout without any items.</p>
        <Button onClick={() => navigate('/')}>Go Shopping</Button>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
          <h2 className="text-lg font-semibold border-b pb-3">Shipping Information</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-bold">{customer.name}</p>
            <p className="text-sm text-gray-600">{customer.email}</p>
            <p className="text-sm text-gray-600 mt-1">{customer.address}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
          <h2 className="text-lg font-semibold border-b pb-3">Order Summary</h2>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item._id} className="flex items-center gap-3">
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">{formatCurrency(SHIPPING_FEE)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taxes ({(TAX_RATE * 100).toFixed(0)}%)</span>
              <span className="font-medium">{formatCurrency(tax)}</span>
            </div>
            <div className="border-t pt-4 mt-4 flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </div>
          <Button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            size="lg"
            className="w-full mt-4"
          >
            {isPlacingOrder ? 'Placing Order...' : `Pay ${formatCurrency(finalTotal)}`}
          </Button>
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}