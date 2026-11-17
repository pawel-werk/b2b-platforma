import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, ChevronRight } from "lucide-react";
import { useShop } from "../context/ShopContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MenuDrawer({ isOpen, onClose }: Props) {
  const { shop, catalog } = useShop();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menu główne">
      <div
        className="fixed inset-0 bg-shop-navy/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-10 w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="p-6 border-b border-shop-border flex items-center justify-between">
            <span className="font-bold tracking-widest uppercase text-shop-navy text-sm">
              {shop.name}
            </span>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Zamknij menu"
              className="p-2 rounded-full hover:bg-shop-surface text-shop-text focus:outline-none focus:ring-2 focus:ring-shop-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-shop-muted">Nawigacja</p>
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 text-base font-medium text-shop-text hover:text-shop-accent"
              >
                <span>Strona główna</span>
                <ChevronRight className="w-4 h-4 text-shop-muted" />
              </Link>
              <Link
                to="/sklep"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 text-base font-medium text-shop-text hover:text-shop-accent"
              >
                <span>Sklep – wszystkie produkty</span>
                <ChevronRight className="w-4 h-4 text-shop-muted" />
              </Link>
              <Link
                to="/zamowienia"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 text-base font-medium text-shop-text hover:text-shop-accent"
              >
                <span>Sprawdź zamówienie</span>
                <ChevronRight className="w-4 h-4 text-shop-muted" />
              </Link>
            </div>

            <div className="pt-4 border-t border-shop-border space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-shop-muted">
                Kategorie marki
              </p>
              {catalog.categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/sklep/${cat.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between py-2 text-sm font-medium text-shop-text hover:text-shop-accent"
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-shop-muted">({cat.count})</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="p-6 border-t border-shop-border bg-shop-surface text-xs text-shop-muted space-y-1">
          <p className="font-semibold text-shop-text">{shop.seller.companyName}</p>
          <p>{shop.seller.email}</p>
        </div>
      </div>
    </div>
  );
}
