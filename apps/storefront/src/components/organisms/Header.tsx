import { Link } from '../../lib/router';
import { useCartStore } from '../../lib/store';
import { Badge } from '../atoms/Badge';

interface HeaderProps {
  onCartOpen: () => void;
  onSupportOpen: () => void;
}

export function Header({ onCartOpen, onSupportOpen }: HeaderProps) {
  const itemCount = useCartStore((state) => state.getItemCount());
  
  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
              <span className="text-white font-black text-2xl">S</span>
              <div className="absolute inset-0 bg-white/20 rounded-2xl transform scale-0 group-hover:scale-100 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-gradient tracking-tight">
                Shoplite
              </span>
              <span className="text-xs text-gray-500 font-medium -mt-1">Modern Shopping</span>
            </div>
          </Link>
          
          <nav className="flex items-center space-x-2 sm:space-x-8">
            <Link
              to="/"
              className="relative px-4 py-2 text-gray-700 hover:text-purple-600 font-semibold transition-colors duration-300 group"
            >
              Products
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:w-full transition-all duration-300" />
            </Link>
            
            <button
              onClick={onSupportOpen}
              className="relative px-4 py-2 text-gray-700 hover:text-purple-600 font-semibold transition-colors duration-300 group hidden sm:block"
              aria-label="Open support"
            >
              Support
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:w-full transition-all duration-300" />
            </button>
            
            <button
              onClick={onCartOpen}
              className="relative p-3 text-gray-700 hover:text-purple-600 transition-colors duration-300 hover:bg-purple-50 rounded-2xl group"
              aria-label={`Shopping cart with ${itemCount} items`}
            >
              <svg
                className="w-7 h-7 transform group-hover:scale-110 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[24px] h-6 px-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg animate-pulse-slow">
                  {itemCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}