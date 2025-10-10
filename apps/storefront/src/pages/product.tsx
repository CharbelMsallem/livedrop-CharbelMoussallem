import { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';
import { getProduct, listProducts, Product } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { useCartStore } from '../lib/store';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { ProductCard } from '../components/molecules/ProductCard';

export function ProductPage() {
  const { params } = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  
  useEffect(() => {
    loadProduct();
  }, [params.id]);
  
  async function loadProduct() {
    if (!params.id) return;
    
    setLoading(true);
    try {
      const data = await getProduct(params.id);
      setProduct(data);
      
      if (data) {
        const allProducts = await listProducts();
        const related = allProducts
          .filter(p => p.id !== data.id && p.tags.some(t => data.tags.includes(t)))
          .slice(0, 3);
        setRelatedProducts(related);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Not Found</h1>
        <p className="text-gray-600">The product you're looking for doesn't exist.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex flex-col">
          <div className="mb-4 flex flex-wrap gap-2">
            {product.tags.map(tag => (
              <Badge key={tag} variant="info">{tag}</Badge>
            ))}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.title}</h1>
          
          <div className="flex items-baseline gap-4 mb-6">
            <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {formatCurrency(product.price)}
            </p>
            {product.stockQty < 20 && (
              <Badge variant="warning">Only {product.stockQty} left!</Badge>
            )}
          </div>
          
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            {product.description}
          </p>
          
          <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700 font-medium">{product.stockQty} in stock</span>
          </div>
          
          <Button
            onClick={() => addItem(product)}
            size="lg"
            className="w-full mb-4"
          >
            Add to Cart
          </Button>
          
          <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-600">
            <div>
              <svg className="w-8 h-8 mx-auto mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <p className="font-semibold">Free Shipping</p>
            </div>
            <div>
              <svg className="w-8 h-8 mx-auto mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="font-semibold">Secure Payment</p>
            </div>
            <div>
              <svg className="w-8 h-8 mx-auto mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="font-semibold">30-Day Returns</p>
            </div>
          </div>
        </div>
      </div>
      
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}