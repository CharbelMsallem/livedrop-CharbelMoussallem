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
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary animate-spin" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="relative bg-gradient-to-br from-primary via-teal-700 to-secondary text-white py-12 sm:py-16 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial opacity-30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-5xl font-black mb-4 leading-tight">
            Discover Amazing
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-teal-200">
              Products
            </span>
          </h1>
          <p className="text-base sm:text-lg text-teal-100 font-medium max-w-2xl mx-auto">
            Shop the latest trends with unbeatable prices
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by product name or tag..."
            />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none w-full sm:w-auto pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-semibold text-gray-700 bg-white hover:border-gray-300 transition-all cursor-pointer text-sm"
              aria-label="Sort products"
            >
              <option value="name">Sort by Name</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedTag('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all transform hover:scale-105 ${
              selectedTag === ''
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
            }`}
          >
            All Products
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all transform hover:scale-105 capitalize ${
                selectedTag === tag
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600 font-semibold text-sm">
            Showing <span className="text-primary font-bold">{filteredProducts.length}</span> of {products.length} products
          </p>
        </div>

        <ProductGrid products={filteredProducts} />
      </div>
    </div>
  );
}