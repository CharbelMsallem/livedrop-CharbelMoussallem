import { useState } from 'react';
import { useCartStore } from '../lib/store';
import { formatCurrency } from '../lib/format';
import { placeOrder } from '../lib/api';
import { Button } from '../components/atoms/Button';
import { useRouter } from '../lib/router';
import { Input } from '../components/atoms/Input';

type FormErrors = {
  [key: string]: string;
};

export function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore();
  const { navigate } = useRouter();
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', email: '', address: '', city: '', zipCode: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [paymentMethod, setPaymentMethod] = useState('credit-card');

  const subtotal = getTotal();
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (items.length === 0 && !processing) {
    navigate('/cart');
    return null;
  }

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is not valid';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.zipCode) newErrors.zipCode = 'ZIP code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { orderId } = placeOrder(items);
      clearCart();
      navigate(`/order/${orderId}`); // Navigate directly to order status page
    } catch (error) {
      console.error('Order failed:', error);
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
              <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} error={errors.fullName} placeholder="John Doe" />
              <Input label="Email" name="email" value={formData.email} onChange={handleInputChange} error={errors.email} placeholder="you@example.com" />
              <Input label="Address" name="address" value={formData.address} onChange={handleInputChange} error={errors.address} placeholder="123 Main St" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" name="city" value={formData.city} onChange={handleInputChange} error={errors.city} placeholder="New York" />
                <Input label="ZIP Code" name="zipCode" value={formData.zipCode} onChange={handleInputChange} error={errors.zipCode} placeholder="10001" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${paymentMethod === 'credit-card' ? 'border-primary bg-teal-50/50' : 'border-gray-300 hover:border-gray-400'}`}>
                <input type="radio" name="payment" value="credit-card" checked={paymentMethod === 'credit-card'} onChange={() => setPaymentMethod('credit-card')} className="w-4 h-4 text-primary focus:ring-primary" />
                <span className="ml-3 font-semibold text-sm">Credit Card</span>
              </label>
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${paymentMethod === 'paypal' ? 'border-primary bg-teal-50/50' : 'border-gray-300 hover:border-gray-400'}`}>
                <input type="radio" name="payment" value="paypal" checked={paymentMethod === 'paypal'} onChange={() => setPaymentMethod('paypal')} className="w-4 h-4 text-primary focus:ring-primary" />
                <span className="ml-3 font-semibold text-sm">PayPal</span>
              </label>
            </div>
          </div>
        </div>
        <div>
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-200 text-sm">
                  <img src={item.image} alt={item.title} className="w-14 h-14 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.title}</p>
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
            <Button onClick={handlePlaceOrder} disabled={processing} size="md" className="w-full">
              {processing ? 'Processing...' : 'Place Order'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}