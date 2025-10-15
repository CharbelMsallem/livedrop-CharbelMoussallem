// apps/storefront/src/components/organisms/CartDrawer.tsx

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
  const { items, total } = useCartStore();
  const { navigate } = useRouter();

  const handleCheckout = () => {
    onClose();
    navigate('/cart');
  };

  return (
    <div
      className={`fixed inset-0 bg-gray-800 bg-opacity-50 z-40 transition-opacity ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-xl transform transition-transform z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="text-lg font-bold">Your Cart</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {items.length === 0 ? (
              <p className="text-center text-gray-500">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {items.map(item => (
                  <CartItem key={item._id} item={item} />
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="p-5 border-t bg-gray-50">
              <div className="flex justify-between items-center font-bold mb-4">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <Button onClick={handleCheckout} className="w-full" size="lg">
                Go to Cart
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}