// apps/storefront/src/lib/store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem, Customer } from './api';

// --- User Store ---
interface UserState {
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
}

export const useUserStore = create(
  persist<UserState>(
    (set) => ({
      customer: null,
      setCustomer: (customer) => set({ customer }),
    }),
    {
      name: 'shoplite-user-storage', // name of the item in the storage (must be unique)
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
          const existing = state.items.find((item) => item._id === product._id);
          let newItems;
          if (existing) {
            newItems = state.items.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
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
          const newItems = state.items.filter((item) => item._id !== productId);
          return { items: newItems, ...calculateState(newItems) };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          let newItems;
          if (quantity <= 0) {
            newItems = state.items.filter((item) => item._id !== productId);
          } else {
            newItems = state.items.map((item) =>
              item._id === productId ? { ...item, quantity } : item
            );
          }
          return { items: newItems, ...calculateState(newItems) };
        });
      },

      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 });
      },
    }),
    {
      name: 'shoplite-cart-storage', // name of the item in the storage (must be unique)
    }
  )
);