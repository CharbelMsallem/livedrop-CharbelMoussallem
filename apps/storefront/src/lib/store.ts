// apps/storefront/src/lib/store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product, CartItem, Customer } from './api';

// --- User Store ---
interface UserState {
  customer: Customer | null;
  lastActivity: number | null; // Timestamp of last user interaction
  setCustomer: (customer: Customer | null) => void;
  resetTimeout: () => void; // Action to reset the activity timer
}

const SESSION_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

export const useUserStore = create(
  persist<UserState>(
    (set, get) => ({
      customer: null,
      lastActivity: null,
      setCustomer: (customer) => {
        set({ customer, lastActivity: customer ? Date.now() : null }); // Reset timer on login/logout
        if (!customer) {
          // Clear cart on logout
          useCartStore.getState().clearCart();
           // Clear chat history on logout - handled in SupportPanel now
        }
      },
      resetTimeout: () => {
        // Only reset if logged in
        if (get().customer) {
          set({ lastActivity: Date.now() });
        }
      },
    }),
    {
      name: 'shoplite-user-storage',
      storage: createJSONStorage(() => localStorage), // Use localStorage
      onRehydrateStorage: () => (state) => {
        // Check for timeout on rehydration (loading from storage)
        if (state?.customer && state.lastActivity) {
          const now = Date.now();
          if (now - state.lastActivity > SESSION_TIMEOUT_MS) {
            console.log("Session timed out on load.");
            state.customer = null; // Log out if timed out
            state.lastActivity = null;
          } else {
            // If not timed out, update lastActivity to now as they are active again
            state.lastActivity = now;
          }
        }
      }
    }
  )
);

// --- Cart Store ---
interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const calculateState = (items: CartItem[]) => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { itemCount, total };
};

export const useCartStore = create(
  persist<CartState>(
    (set) => ({
      items: [],
      total: 0,
      itemCount: 0,

      addItem: (product) => {
        set((state) => {
          useUserStore.getState().resetTimeout(); // Reset session timer on cart action
          const existing = state.items.find((item) => item._id === product._id);
          let newItems;
          if (existing) {
            newItems = state.items.map((item) =>
              item._id === product._id
                ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } // Respect stock limit
                : item
            );
          } else {
            newItems = [...state.items, { ...product, quantity: 1 }];
          }
          return { items: newItems, ...calculateState(newItems) };
        });
      },

      removeItem: (productId) => {
        set((state) => {
          useUserStore.getState().resetTimeout(); // Reset session timer
          const newItems = state.items.filter((item) => item._id !== productId);
          return { items: newItems, ...calculateState(newItems) };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          useUserStore.getState().resetTimeout(); // Reset session timer
          let newItems;
          const productInCart = state.items.find(item => item._id === productId);
          const maxQuantity = productInCart?.stock ?? 0; // Get stock limit

          if (quantity <= 0) {
            newItems = state.items.filter((item) => item._id !== productId);
          } else {
             // Ensure quantity doesn't exceed stock
            const validQuantity = Math.min(quantity, maxQuantity);
            newItems = state.items.map((item) =>
              item._id === productId ? { ...item, quantity: validQuantity } : item
            );
          }
          return { items: newItems, ...calculateState(newItems) };
        });
      },

      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 });
         // Resetting timeout here might be redundant if clearCart is only called on logout/order
      },
    }),
    {
      name: 'shoplite-cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function startSessionTimeoutCheck() {
  setInterval(() => {
    const { customer, lastActivity, setCustomer } = useUserStore.getState();
    if (customer && lastActivity) {
      const now = Date.now();
      if (now - lastActivity > SESSION_TIMEOUT_MS) {
        console.log("Session timed out due to inactivity.");
        setCustomer(null); // Log out
      }
    }
  }, 60 * 1000); // Check every minute
}