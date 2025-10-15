import { Link } from '../../lib/router';
import { useCartStore } from '../../lib/store';
import { Customer } from '../../lib/api';

interface HeaderProps {
  currentUser: Customer;
  onLogout: () => void;
  onCartOpen: () => void;
  onSupportOpen: () => void;
}

export function Header({ currentUser, onLogout, onCartOpen, onSupportOpen }: HeaderProps) {
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <span className="text-xl font-black text-gradient tracking-tight">
              Shoplite
            </span>
          </Link>

          <nav className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                Hello, {currentUser.name.split(' ')[0]}
              </span>
              <button onClick={onLogout} className="px-3 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                Logout
              </button>
            </div>
            <button onClick={onSupportOpen} className="px-3 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
              Support
            </button>
            <button onClick={onCartOpen} className="relative p-2 rounded-full hover:bg-gray-200 transition-colors">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[20px] h-5 px-1 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold rounded-full flex items-center justify-center">
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
