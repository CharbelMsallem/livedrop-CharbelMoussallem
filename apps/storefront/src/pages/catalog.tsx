import { useState, useEffect, useMemo } from 'react';
import { listProducts, Product } from '../lib/api';
import { SearchBar } from '../components/molecules/SearchBar';
import { ProductGrid } from '../components/organisms/ProductGrid';

export function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('name');
  const [selectedTag, setSelectedTag] = useState<string>('');
  
  useEffect(() => {
    loadProducts();
  }, []);
  
  async function loadProducts() {
    try {
      const data = await listProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    products.forEach(p => p.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [products]);
  
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    
    if (selectedTag) {
      filtered = filtered.filter(p => p.tags.includes(selectedTag));
    }
    
    const sorted = [...filtered];
    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    return sorted;
  }, [products, searchQuery, sortBy, selectedTag]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-spin" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-gray-200"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white py-24 mb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial opacity-30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl sm:text-7xl font-black mb-6 leading-tight">
            Discover Amazing
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
              Products
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-purple-100 font-medium max-w-2xl mx-auto">
            Shop the latest trends with unbeatable prices and free shipping
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by product name or tag..."
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-6 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold text-gray-700 bg-white hover:border-gray-300 transition-all cursor-pointer"
            aria-label="Sort products"
          >
            <option value="name">Sort by Name</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
        
        <div className="flex flex-wrap gap-3 mb-10">
          <button
            onClick={() => setSelectedTag('')}
            className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all transform hover:scale-105 ${
              selectedTag === ''
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
            }`}
          >
            All Products
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all transform hover:scale-105 capitalize ${
                selectedTag === tag
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600 font-semibold">
            Showing <span className="text-purple-600 font-black">{filteredProducts.length}</span> of {products.length} products
          </p>
        </div>
        
        <ProductGrid products={filteredProducts} />
      </div>
    </div>
  );
}