// apps/storefront/src/components/molecules/ProductCard.tsx

import { Product } from '../../lib/api';
import { formatCurrency } from '../../lib/format';
import { useCartStore } from '../../lib/store';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { useRouter } from '../../lib/router';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { navigate } = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const viewProduct = () => {
    navigate(`/products/${product._id}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transform hover:-translate-y-1 transition-all duration-300">
      <div className="aspect-square overflow-hidden cursor-pointer" onClick={viewProduct}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        {product.stock < 10 && (
          <Badge variant="warning" className="mb-2">
            Low Stock
          </Badge>
        )}
        <h3
          className="font-bold text-lg mb-2 cursor-pointer truncate"
          onClick={viewProduct}
          title={product.name}
        >
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4">{formatCurrency(product.price)}</p>
        <Button
          onClick={() => addItem(product)}
          disabled={product.stock === 0}
          className="w-full"
        >
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </div>
    </div>
  );
}