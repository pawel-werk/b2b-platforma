import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CartStore = {
  items: Record<string, number>;
  add: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

// Klucz zależy od hosta, by koszyki różnych marek się nie mieszały
const storeKey = `cart_${window.location.hostname}`;

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: {},
      add: (id, qty) => set((state) => ({ items: { ...state.items, [id]: (state.items[id] || 0) + qty } })),
      remove: (id) => set((state) => { const next = { ...state.items }; delete next[id]; return { items: next }; }),
      clear: () => set({ items: {} })
    }),
    { name: storeKey }
  )
);
