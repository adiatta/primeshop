import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((s) => {
        const ex = s.items.find(i => i.id === item.id);
        if (ex) return { items: s.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i) };
        return { items: [...s.items, item] };
      }),
      removeItem: (id) => set((s) => ({ items: s.items.filter(i => i.id !== id) })),
      updateQuantity: (id, qty) => set((s) => ({ items: s.items.map(i => i.id === id ? { ...i, quantity: qty } : i) })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'primeshop-cart' }
  )
);