import { create } from 'zustand';
import type { Product, CartItem } from './api';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CART_STORAGE_KEY = 'shoplite-cart';

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save cart:', e);
  }
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: loadCart(),
  
  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((item) => item.id === product.id);
      let newItems;
      
      if (existing) {
        newItems = state.items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, { ...product, quantity: 1 }];
      }
      
      saveCart(newItems);
      return { items: newItems };
    });
  },
  
  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.id !== productId);
      saveCart(newItems);
      return { items: newItems };
    });
  },
  
  updateQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        const newItems = state.items.filter((item) => item.id !== productId);
        saveCart(newItems);
        return { items: newItems };
      }
      
      const newItems = state.items.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
      saveCart(newItems);
      return { items: newItems };
    });
  },
  
  clearCart: () => {
    saveCart([]);
    set({ items: [] });
  },
  
  getTotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
  
  getItemCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));