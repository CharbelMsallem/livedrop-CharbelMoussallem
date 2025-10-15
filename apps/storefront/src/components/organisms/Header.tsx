// apps/storefront/src/components/organisms/Header.tsx

import { useState } from 'react';
import { useCartStore } from '../../lib/store';
import { CartDrawer } from './CartDrawer';
import { useRouter } from '../../lib/router';

interface HeaderProps {
  onSupportOpen: () => void;
}

export function Header({ onSupportOpen }: HeaderProps) {
  const [isCartOpen, setCartOpen] = useState(false);
  const itemCount = useCartStore((state) => state.itemCount);
  const { navigate } = useRouter();

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div
              className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent cursor-pointer"
              onClick={() => navigate('/')}
            >
              Shoplite
            </div>
            <div className="flex items-center gap-2">
               <button
                onClick={onSupportOpen}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Open support chat"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <div className="relative">
                <button
                  onClick={() => setCartOpen(true)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Open cart"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center animate-pulse">
                      {itemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <CartDrawer isOpen={isCartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}