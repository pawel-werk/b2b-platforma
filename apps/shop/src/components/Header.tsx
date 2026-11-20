import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, ShoppingBag, X } from "lucide-react";
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
      <header className="sticky top-0 z-40 bg-shop-bg/90 backdrop-blur-md border-b border-shop-line">
        <div className="max-w-[1520px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between gap-4">
          {/* Lewa strona: Cienka ikona 2 linii + Menu */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Otwórz menu"
              className="inline-flex items-center gap-3 py-2 pr-3 text-shop-ink hover:text-shop-bronze transition-colors"
            >
              <svg
                viewBox="0 0 24 14"
                className="w-5 h-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                aria-hidden="true"
              >
                <line x1="0" y1="3" x2="24" y2="3" />
                <line x1="0" y1="11" x2="24" y2="11" />
              </svg>
              <span className="text-[12px] font-normal uppercase tracking-[0.16em]">
                Menu
              </span>
            </button>
          </div>

          {/* Środek: Logo marki z API lub wordmark Cormorant */}
          <div className="flex-shrink-0">
            <Link to="/" className="inline-flex items-center">
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
                <span className="font-display text-[22px] md:text-[26px] font-normal tracking-[0.32em] uppercase text-shop-ink leading-none">
                  {shop.name}
                </span>
              )}
            </Link>
          </div>

          {/* Prawa strona: Wyszukiwarka z podkreśleniem 1px, Konto, Koszyk */}
          <div className="flex items-center gap-4 md:gap-6" ref={searchWrapRef}>
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center relative w-52 lg:w-64"
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
                className="w-full border-b border-shop-ink/40 focus:border-shop-bronze bg-transparent py-1.5 pr-7 text-sm font-light text-shop-ink placeholder:text-shop-muted focus:outline-none transition-colors"
              />
              <button
                type="submit"
                aria-label="Szukaj"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-shop-ink hover:text-shop-bronze p-1 transition-colors"
              >
                <Search className="w-4 h-4" strokeWidth={1.25} />
              </button>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-shop-bg border border-shop-line rounded-none z-50">
                  {suggestions.map((item) => {
                    const v = item.variants[0];
                    return (
                      <Link
                        key={item.id}
                        to={`/produkt/${item.slug}`}
                        onClick={() => setShowSuggestions(false)}
                        className="flex items-center gap-3.5 p-3 hover:bg-shop-surface/60 transition-colors border-b border-shop-line last:border-b-0"
                      >
                        <div className="w-11 h-11 bg-shop-surface flex items-center justify-center shrink-0 p-1">
                          <img
                            src={resolveAssetUrl(v?.images[0]?.url)}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-shop-ink truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] font-light text-shop-muted truncate mt-0.5">
                            {v?.symbol} {item.collection ? `· ${item.collection}` : ""}
                          </p>
                        </div>
                        {v && (
                          <span className="text-xs font-normal text-shop-ink shrink-0">
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
              className="md:hidden p-1.5 text-shop-ink hover:text-shop-bronze transition-colors"
            >
              {mobileSearchOpen ? (
                <X className="w-5 h-5" strokeWidth={1.25} />
              ) : (
                <Search className="w-5 h-5" strokeWidth={1.25} />
              )}
            </button>

            <Link
              to="/zamowienia"
              aria-label="Sprawdź status zamówienia"
              title="Sprawdź status zamówienia"
              className="p-1.5 text-shop-ink hover:text-shop-bronze transition-colors"
            >
              <User className="w-5 h-5" strokeWidth={1.25} />
            </Link>

            <Link
              to="/koszyk"
              aria-label="Koszyk"
              className="relative p-1.5 text-shop-ink hover:text-shop-bronze transition-colors"
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.25} />
              {mounted && count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-shop-ink text-shop-bg text-[10px] font-normal leading-none flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Pasek wyszukiwania na telefonie */}
        {mobileSearchOpen && (
          <div className="md:hidden px-6 pb-4 border-t border-shop-line bg-shop-bg">
            <form onSubmit={handleSearchSubmit} className="flex items-center relative pt-3">
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj po nazwie, kolekcji, SKU, EAN..."
                className="w-full border-b border-shop-ink/40 focus:border-shop-bronze bg-transparent py-2 pr-8 text-sm font-light text-shop-ink placeholder:text-shop-muted focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Szukaj"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-shop-ink p-1"
              >
                <Search className="w-4 h-4" strokeWidth={1.25} />
              </button>
            </form>
          </div>
        )}
      </header>

      <MenuDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}