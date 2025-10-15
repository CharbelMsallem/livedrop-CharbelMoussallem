import { useState } from 'react';
import { useCartStore } from '../lib/store';
import { formatCurrency } from '../lib/format';
import { placeOrder, Customer } from '../lib/api';
import { Button } from '../components/atoms/Button';
import { useRouter } from '../lib/router';
import { Input } from '../components/atoms/Input';

interface CheckoutPageProps {
    currentUser: Customer;
}

type FormErrors = { [key: string]: string; };

export function CheckoutPage({ currentUser }: CheckoutPageProps) {
  const { items, getTotal, clearCart } = useCartStore();
  const { navigate } = useRouter();
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser?.name || '', email: currentUser?.email || '', address: currentUser?.address || '', city: '', zipCode: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  
  const subtotal = getTotal();
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const validateForm = () => { /* ... validation logic ... */ return true; };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setProcessing(true);
    try {
      const order = await placeOrder(currentUser._id, items, total);
      clearCart();
      navigate(`/order/${order._id}`);
    } catch (error) {
      console.error('Order failed:', error);
      alert('There was an error placing your order. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4">Shipping Information</h2>
            <div className="space-y-4">
              <Input label="Full Name" name="fullName" value={formData.fullName} disabled />
              <Input label="Email" name="email" value={formData.email} disabled />
              <Input label="Address" name="address" value={formData.address} disabled />
            </div>
          </div>
        </div>
        <div>
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item._id} className="flex gap-3 pb-3 border-b border-gray-200 text-sm">
                  <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.name}</p>
                    <p className="text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 mb-6 pt-4 border-t border-gray-200 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : formatCurrency(shipping)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(tax)}</span></div>
              <div className="border-t pt-3 flex justify-between text-base font-bold"><span>Total</span><span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{formatCurrency(total)}</span></div>
            </div>
            <Button onClick={handlePlaceOrder} disabled={processing || items.length === 0} size="md" className="w-full">
              {processing ? 'Processing...' : `Place Order for ${formatCurrency(total)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
