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
    e.stopPropagation();
    addItem(product);
  };

  return (
    <Link
      to={`/p/${product.id}`}
      className="group relative bg-white rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 hover-float flex flex-col"
    >
      <div className="relative overflow-hidden aspect-square bg-gray-50">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {product.stockQty < 20 && (
          <div className="absolute top-2.5 right-2.5">
            <Badge variant="warning">Low Stock</Badge>
          </div>
        )}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 transform translate-y-10 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
          <Button
            onClick={handleAddToCart}
            className="w-full shadow-lg backdrop-blur-sm bg-white/90 text-primary hover:bg-white font-bold"
            size="sm"
          >
            Quick Add
          </Button>
        </div>
      </div>
      <div className="p-3 sm:p-4 flex-grow flex flex-col">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {product.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 text-[10px] font-semibold text-primary bg-teal-50 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="font-bold text-sm text-gray-800 mb-2 line-clamp-2 group-hover:text-gradient transition-all duration-300 leading-snug h-10">
          {product.title}
        </h3>
        <div className="flex items-center justify-between mt-auto">
          <div>
            <p className="text-lg sm:text-xl font-black text-gradient">
              {formatCurrency(product.price)}
            </p>
            <p className="text-[10px] text-gray-500 font-medium">{product.stockQty} available</p>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-300">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}