import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, User, ShoppingBag, X } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { useCartStore } from "../store/cartStore";
import { resolveAssetUrl } from "../lib/api";
import { formatGrosze } from "../lib/format";
import { MenuDrawer } from "./MenuDrawer";

export function Header() {
  const { shop, catalog } = useShop();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const count = useCartStore((s) => s.getTotalCount(shop.slug));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return catalog.products
      .filter((p) => {
        const matchName = p.name.toLowerCase().includes(q);
        const matchColl = (p.collection || "").toLowerCase().includes(q);
        const matchVariant = p.variants.some(
          (v) => v.symbol.toLowerCase().includes(q) || v.ean.toLowerCase().includes(q)
        );
        return matchName || matchColl || matchVariant;
      })
      .slice(0, 5);
  }, [query, catalog.products]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    setShowSuggestions(false);
    setMobileSearchOpen(false);
    if (trimmed) {
      navigate(`/sklep?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/sklep");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-shop-border">
        {/* 4px pasek w kolorze granatowym nad nagłówkiem */}
        <div className="h-[4px] w-full bg-shop-navy" />

        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
          {/* Lewa strona: Hamburger + Menu */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2.5 py-2 pr-3 text-shop-text hover:text-shop-accent font-medium text-sm focus:outline-none focus:ring-2 focus:ring-shop-accent rounded-md"
            >
              <Menu className="w-5 h-5" />
              <span>Menu</span>
            </button>
          </div>

          {/* Środek: Logo marki z API (obraz) lub rozstrzelona nazwa marki */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-shop-accent rounded"
            >
              {shop.logoUrl && !logoFailed ? (
                <img
                  src={resolveAssetUrl(shop.logoUrl)}
                  alt={shop.name}
                  width={140}
                  height={36}
                  onError={() => setLogoFailed(true)}
                  className="h-7 md:h-8 w-auto object-contain"
                />
              ) : (
                <span className="text-xl md:text-2xl font-bold tracking-[0.28em] uppercase text-shop-navy">
                  {shop.name}
                </span>
              )}
            </Link>
          </div>

          {/* Prawa strona: Wyszukiwarka z podkreśleniem, Konto (/zamowienia), Koszyk */}
          <div className="flex items-center gap-4 md:gap-6" ref={searchWrapRef}>
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center relative w-56 lg:w-64"
            >
              <input
                type="search"
                value={query}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Szukaj..."
                aria-label="Szukaj produktów po nazwie, kolekcji, SKU lub EAN"
                className="w-full border-b border-shop-text/60 focus:border-shop-accent bg-transparent py-1 pr-7 text-sm text-shop-text placeholder:text-shop-muted focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Szukaj"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-shop-text hover:text-shop-accent p-1"
              >
                <Search className="w-4 h-4" />
              </button>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-shop-border rounded-card shadow-xl overflow-hidden z-50">
                  {suggestions.map((item) => {
                    const v = item.variants[0];
                    return (
                      <Link
                        key={item.id}
                        to={`/produkt/${item.slug}`}
                        onClick={() => setShowSuggestions(false)}
                        className="flex items-center gap-3 p-3 hover:bg-shop-surface transition border-b border-shop-border last:border-b-0"
                      >
                        <img
                          src={resolveAssetUrl(v?.images[0]?.url)}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-contain bg-shop-surface rounded"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-shop-text truncate">{item.name}</p>
                          <p className="text-[11px] text-shop-muted truncate">
                            {v?.symbol} {item.collection ? `• ${item.collection}` : ""}
                          </p>
                        </div>
                        {v && (
                          <span className="text-xs font-bold text-shop-navy shrink-0">
                            {formatGrosze(v.price.bruttoGrosze)}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </form>

            {/* Przycisk lupki na telefonie */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Otwórz wyszukiwarkę"
              className="md:hidden p-1.5 text-shop-text hover:text-shop-accent"
            >
              {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            <Link
              to="/zamowienia"
              aria-label="Sprawdź status zamówienia"
              title="Sprawdź status zamówienia"
              className="p-1.5 text-shop-text hover:text-shop-accent focus:outline-none focus:ring-2 focus:ring-shop-accent rounded-full"
            >
              <User className="w-5 h-5" />
            </Link>

            <Link
              to="/koszyk"
              aria-label="Koszyk"
              className="relative p-1.5 text-shop-text hover:text-shop-accent focus:outline-none focus:ring-2 focus:ring-shop-accent rounded-full"
            >
              <ShoppingBag className="w-5 h-5" />
              {mounted && count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-pill bg-shop-navy text-white text-[10px] font-bold flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Pasek wyszukiwania na telefonie */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-4 border-t border-shop-border bg-white">
            <form onSubmit={handleSearchSubmit} className="flex items-center relative pt-2">
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj po nazwie, kolekcji, SKU, EAN..."
                className="w-full border-b border-shop-text py-2 pr-8 text-sm focus:outline-none"
              />
              <button type="submit" aria-label="Szukaj" className="absolute right-1 top-1/2 -translate-y-1/2">
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </header>

      <MenuDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
