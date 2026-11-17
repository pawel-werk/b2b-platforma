import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type B2BCartStore = {
  carts: Record<string, Record<string, number>>;
  add: (companyId: string, productId: string, qty: number) => void;
  clear: (companyId: string) => void;
  getTotalItems: (companyId: string) => number;
};

export const useB2BCart = create<B2BCartStore>()(
  persist(
    (set, get) => ({
      carts: {},
      add: (companyId, productId, qty) => set((state) => {
        const companyCart = state.carts[companyId] || {};
        return {
          carts: {
            ...state.carts,
            [companyId]: { ...companyCart, [productId]: (companyCart[productId] || 0) + qty }
          }
        };
      }),
      clear: (companyId) => set((state) => {
        const newCarts = { ...state.carts };
        delete newCarts[companyId];
        return { carts: newCarts };
      }),
      getTotalItems: (companyId) => {
        const companyCart = get().carts[companyId] || {};
        return Object.values(companyCart).reduce((a, b) => a + b, 0);
      }
    }),
    { name: 'b2b-cart-persist' }
  )
);
