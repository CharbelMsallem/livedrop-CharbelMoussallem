// apps/storefront/src/components/molecules/CartItem.tsx

import { useCartStore } from '../../lib/store';
import { CartItem as CartItemType } from '../../lib/api';
import { formatCurrency } from '../../lib/format';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="flex items-center gap-4 p-2 bg-white rounded-lg shadow-sm">
      <img
        src={item.imageUrl}
        alt={item.name}
        className="w-16 h-16 rounded-md object-cover"
      />
      <div className="flex-1">
        <p className="font-semibold text-sm">{item.name}</p>
        <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => updateQuantity(item._id, parseInt(e.target.value, 10))}
          className="w-14 p-1 border rounded-md text-center"
        />
        <button
          onClick={() => removeItem(item._id)}
          className="text-red-500 hover:text-red-700 p-1"
        >
          &times;
        </button>
      </div>
    </div>
  );
}