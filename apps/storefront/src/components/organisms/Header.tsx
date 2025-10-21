// apps/storefront/src/components/organisms/Header.tsx

import { useState } from 'react';
import { useCartStore, useUserStore } from '../../lib/store';
import { CartDrawer } from './CartDrawer';
import { useRouter } from '../../lib/router'; // Make sure useRouter is imported

interface HeaderProps {
  onSupportOpen: () => void;
}

export function Header({ onSupportOpen }: HeaderProps) {
  const [isCartOpen, setCartOpen] = useState(false);
  const itemCount = useCartStore((state) => state.itemCount);
  const { setCustomer } = useUserStore();
  const { navigate } = useRouter(); // Use the router hook

  const handleLogout = () => {
    setCustomer(null); // This will clear the user from state and localStorage
    navigate('/'); // Redirect to home page after logout
  };

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
            {/* --- Updated right-side icons section --- */}
            <div className="flex items-center gap-2">
               <button
                onClick={onSupportOpen}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Open support chat"
              >
                {/* Support Icon */}
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
                  {/* Cart Icon */}
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
              <button
                onClick={() => navigate('/profile')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Go to profile"
              >
                {/* Profile Icon */}
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              {/* --- New Admin Dashboard Button --- */}
              <button
                onClick={() => navigate('/admin')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Go to Admin Dashboard"
              >
                {/* Admin/Dashboard Icon (Example: Cog icon) */}
                 <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>
              {/* --- End of New Button --- */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Logout"
              >
                {/* Logout Icon */}
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      <CartDrawer isOpen={isCartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}