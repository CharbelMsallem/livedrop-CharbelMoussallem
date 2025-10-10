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
    <div className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-primary/20 transition-all duration-300 hover:shadow-md">
      <img
        src={item.image}
        alt={item.title}
        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-gray-100 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 mb-1 leading-tight line-clamp-2">{item.title}</h4>
        <p className="text-base sm:text-lg font-black text-gradient mb-2">{formatCurrency(item.price)}</p>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            variant="outline"
            size="sm"
            className="!rounded-lg !p-0 w-8 h-8 !text-lg"
          >
            −
          </Button>
          <span className="w-10 text-center font-black text-base sm:text-lg text-gray-900">{item.quantity}</span>
          <Button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            variant="outline"
            size="sm"
            className="!rounded-lg !p-0 w-8 h-8 !text-lg"
          >
            +
          </Button>
        </div>
      </div>
      <div className="text-right flex flex-col justify-between items-end">
        <p className="font-black text-lg sm:text-xl text-gray-900">
          {formatCurrency(item.price * item.quantity)}
        </p>
        <Button
          onClick={() => removeItem(item.id)}
          variant="danger"
          size="sm"
          className="!text-xs !py-1 !px-3"
        >
          Remove
        </Button>
      </div>
    </div>
  );
}