import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AvailabilityStatus } from "@repo/shared";

export interface CartItem {
  variantId: string;
  productSlug: string;
  productName: string;
  collection: string | null;
  category: string;
  symbol: string;
  ean: string;
  colorName: string;
  colorCode: string;
  swatchHex: string;
  imageUrl: string;
  nettoGrosze: number;
  vatRate: number;
  bruttoGrosze: number;
  availability: AvailabilityStatus;
  quantity: number;
}

interface CartState {
  cartsByShop: Record<string, CartItem[]>;
  getItems: (shopSlug: string) => CartItem[];
  getTotalCount: (shopSlug: string) => number;
  addItem: (shopSlug: string, item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (shopSlug: string, variantId: string, quantity: number) => void;
  removeItem: (shopSlug: string, variantId: string) => void;
  clearCart: (shopSlug: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartsByShop: {},
      getItems: (shopSlug) => get().cartsByShop[shopSlug] || [],
      getTotalCount: (shopSlug) =>
        (get().cartsByShop[shopSlug] || []).reduce((sum, i) => sum + i.quantity, 0),
      addItem: (shopSlug, item, quantity = 1) =>
        set((state) => {
          const current = state.cartsByShop[shopSlug] || [];
          const idx = current.findIndex((i) => i.variantId === item.variantId);
          let next: CartItem[];
          if (idx > -1) {
            next = current.map((existing, i) =>
              i === idx ? { ...existing, ...item, quantity: existing.quantity + quantity } : existing
            );
          } else {
            next = [...current, { ...item, quantity }];
          }
          return { cartsByShop: { ...state.cartsByShop, [shopSlug]: next } };
        }),
      updateQuantity: (shopSlug, variantId, quantity) =>
        set((state) => {
          const current = state.cartsByShop[shopSlug] || [];
          const next =
            quantity <= 0
              ? current.filter((i) => i.variantId !== variantId)
              : current.map((i) => (i.variantId === variantId ? { ...i, quantity } : i));
          return { cartsByShop: { ...state.cartsByShop, [shopSlug]: next } };
        }),
      removeItem: (shopSlug, variantId) =>
        set((state) => {
          const current = state.cartsByShop[shopSlug] || [];
          return {
            cartsByShop: {
              ...state.cartsByShop,
              [shopSlug]: current.filter((i) => i.variantId !== variantId),
            },
          };
        }),
      clearCart: (shopSlug) =>
        set((state) => ({
          cartsByShop: { ...state.cartsByShop, [shopSlug]: [] },
        })),
    }),
    {
      name: "b2c-shop-carts-storage",
    }
  )
);
