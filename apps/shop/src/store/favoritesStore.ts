import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  favoritesByShop: Record<string, string[]>;
  isFavorite: (shopSlug: string, productId: string) => boolean;
  toggleFavorite: (shopSlug: string, productId: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoritesByShop: {},
      isFavorite: (shopSlug, productId) =>
        (get().favoritesByShop[shopSlug] || []).includes(productId),
      toggleFavorite: (shopSlug, productId) =>
        set((state) => {
          const current = state.favoritesByShop[shopSlug] || [];
          const exists = current.includes(productId);
          const next = exists
            ? current.filter((id) => id !== productId)
            : [...current, productId];
          return {
            favoritesByShop: { ...state.favoritesByShop, [shopSlug]: next },
          };
        }),
    }),
    {
      name: "b2c-shop-favorites-storage",
    }
  )
);
