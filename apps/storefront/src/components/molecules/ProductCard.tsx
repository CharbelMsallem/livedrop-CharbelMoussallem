import { Product } from '../../lib/api';
import { formatCurrency } from '../../lib/format';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Link } from '../../lib/router';
import { useCartStore } from '../../lib/store';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
  };
  
  return (
    <Link
      to={`/p/${product.id}`}
      className="group relative bg-white rounded-3xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-500 hover-float"
    >
      <div className="relative overflow-hidden aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {product.stockQty < 20 && (
          <div className="absolute top-4 right-4 animate-pulse-slow">
            <Badge variant="warning">Low Stock</Badge>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4 transform translate-y-12 group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100">
          <Button
            onClick={handleAddToCart}
            className="w-full shadow-xl backdrop-blur-sm bg-white/95 text-purple-600 hover:bg-white font-bold"
            size="sm"
          >
            Quick Add to Cart
          </Button>
        </div>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {product.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-1 text-xs font-semibold text-purple-600 bg-purple-50 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-gradient transition-all duration-300 leading-tight">
          {product.title}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-black text-gradient">
              {formatCurrency(product.price)}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{product.stockQty} available</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}