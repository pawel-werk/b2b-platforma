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
    // Domyślnie utrzymujemy barwy biało-granatowe (#0B2545 i #1E5BC6), ustawiając też zmienne marki z API
    const apiPrimary = resolveQuery.data.colors?.primary;
    const apiSecondary = resolveQuery.data.colors?.secondary;
    root.style.setProperty("--brand-api-primary", apiPrimary || "#0B2545");
    root.style.setProperty("--brand-api-secondary", apiSecondary || "#1E5BC6");
    root.style.setProperty("--shop-navy", "#0B2545");
    root.style.setProperty("--shop-accent", "#1E5BC6");
  }, [resolveQuery.data]);

  if (resolveQuery.isLoading || (slug && catalogQuery.isLoading)) {
    return (
      <div className="min-h-screen bg-shop-bg">
        <div className="h-1 bg-shop-navy w-full" />
        <div className="max-w-[1440px] mx-auto px-6 py-6 flex items-center justify-between border-b border-shop-border">
          <div className="h-6 w-24 bg-shop-surface animate-pulse rounded" />
          <div className="h-8 w-40 bg-shop-surface animate-pulse rounded" />
          <div className="h-6 w-32 bg-shop-surface animate-pulse rounded" />
        </div>
        <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 h-[420px] bg-shop-surface animate-pulse rounded-card" />
            <div className="lg:col-span-8 h-[420px] bg-shop-surface animate-pulse rounded-card" />
          </div>
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="w-28 h-28 rounded-full bg-shop-surface animate-pulse shrink-0" />
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
      <div className="min-h-screen bg-shop-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-shop-surface border border-shop-border rounded-card p-8 space-y-4">
          <h1 className="text-2xl font-bold text-shop-text tracking-tight">
            Przerwa w połączeniu z katalogiem
          </h1>
          <p className="text-sm text-shop-muted">{errMsg}</p>
          <button
            type="button"
            onClick={() => {
              resolveQuery.refetch();
              catalogQuery.refetch();
            }}
            className="inline-flex items-center justify-center px-6 py-3 rounded-pill bg-shop-accent text-white font-medium text-sm hover:bg-shop-navy transition focus:outline-none focus:ring-2 focus:ring-shop-accent focus:ring-offset-2"
          >
            Spróbuj ponownie
          </button>
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
