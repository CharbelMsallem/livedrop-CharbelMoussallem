import { CartItem as CartItemType } from '../../lib/api';
import { formatCurrency } from '../../lib/format';
import { useCartStore } from '../../lib/store';
import { Button } from '../atoms/Button';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  
  return (
    <div className="flex gap-4 p-5 bg-white rounded-3xl border-2 border-gray-100 hover:border-purple-200 transition-all duration-300 hover:shadow-md">
      <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 mb-1 leading-tight">{item.title}</h4>
        <p className="text-lg font-black text-gradient mb-3">{formatCurrency(item.price)}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-600 font-bold transition-all transform active:scale-95"
          >
            −
          </button>
          <span className="w-12 text-center font-black text-lg text-gray-900">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-600 font-bold transition-all transform active:scale-95"
          >
            +
          </button>
          <button
            onClick={() => removeItem(item.id)}
            className="ml-auto px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm transition-all transform active:scale-95"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-black text-2xl text-gray-900">
          {formatCurrency(item.price * item.quantity)}
        </p>
      </div>
    </div>
  );
}