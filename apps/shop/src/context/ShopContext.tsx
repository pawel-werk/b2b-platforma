import React, { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ShopResolveResponse, ShopCatalogResponse } from "@repo/shared";
import { apiResolveShop, apiGetCatalog } from "../lib/api";

interface ShopContextValue {
  shop: ShopResolveResponse;
  catalog: ShopCatalogResponse;
  refetchAll: () => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const resolveQuery = useQuery({
    queryKey: ["shop-resolve"],
    queryFn: apiResolveShop,
    retry: 1,
  });

  const slug = resolveQuery.data?.slug;

  const catalogQuery = useQuery({
    queryKey: ["shop-catalog", slug],
    queryFn: () => apiGetCatalog(slug!),
    enabled: Boolean(slug),
    retry: 1,
  });

  useEffect(() => {
    if (!resolveQuery.data) return;
    const root = document.documentElement;
    const apiPrimary = resolveQuery.data.colors?.primary;
    const apiSecondary = resolveQuery.data.colors?.secondary;
    root.style.setProperty("--brand-api-primary", apiPrimary || "#1C1A17");
    root.style.setProperty("--brand-api-secondary", apiSecondary || "#8C735A");
    root.style.setProperty("--shop-navy", "#1C1A17");
    root.style.setProperty("--shop-accent", "#8C735A");
  }, [resolveQuery.data]);

  if (resolveQuery.isLoading || (slug && catalogQuery.isLoading)) {
    return (
      <div className="min-h-screen bg-shop-bg">
        <div className="border-b border-shop-line">
          <div className="max-w-[1520px] mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
            <div className="h-4 w-20 bg-shop-surface animate-pulse rounded-[2px]" />
            <div className="h-6 w-36 bg-shop-surface animate-pulse rounded-[2px]" />
            <div className="h-4 w-28 bg-shop-surface animate-pulse rounded-[2px]" />
          </div>
        </div>
        <div className="max-w-[1520px] mx-auto px-6 md:px-10 py-10 md:py-14 space-y-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 h-[420px] md:h-[520px] bg-shop-surface animate-pulse rounded-[2px]" />
            <div className="lg:col-span-8 h-[420px] md:h-[520px] bg-shop-surface animate-pulse rounded-[2px]" />
          </div>
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-32 h-24 bg-shop-surface animate-pulse rounded-[2px] shrink-0"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (resolveQuery.isError || catalogQuery.isError || !resolveQuery.data || !catalogQuery.data) {
    const errMsg =
      (resolveQuery.error as Error)?.message ||
      (catalogQuery.error as Error)?.message ||
      "Nie udało się połączyć z serwerem sklepu.";

    return (
      <div className="min-h-screen bg-shop-bg flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-md w-full border border-shop-line bg-shop-bg rounded-[2px] p-10 md:p-12 space-y-6">
          <p className="label">Błąd połączenia</p>
          <h1 className="font-display text-3xl md:text-4xl font-normal tracking-[-0.01em] leading-[1.05] text-shop-ink">
            Przerwa w połączeniu z katalogiem
          </h1>
          <p className="text-sm font-light text-shop-muted leading-relaxed">{errMsg}</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                resolveQuery.refetch();
                catalogQuery.refetch();
              }}
              className="inline-flex h-12 items-center justify-center px-8 rounded-[2px] border border-shop-ink bg-shop-ink text-shop-bg text-[12px] font-normal uppercase tracking-[0.14em] transition-colors duration-300 hover:bg-transparent hover:text-shop-ink"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ShopContext.Provider
      value={{
        shop: resolveQuery.data,
        catalog: catalogQuery.data,
        refetchAll: () => {
          resolveQuery.refetch();
          catalogQuery.refetch();
        },
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop musi być użyty wewnątrz ShopProvider");
  return ctx;
}