import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, ChevronRight } from "lucide-react";
import { useShop } from "../context/ShopContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type DrawerTab = "products" | "collections";

export function MenuDrawer({ isOpen, onClose }: Props) {
  const { shop, catalog } = useShop();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>("products");
  const [entered, setEntered] = useState(false);

  const collections = useMemo(() => {
    const set = new Set<string>();
    for (const p of catalog.products) {
      const col = p.collection?.trim();
      if (col) set.add(col);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"));
  }, [catalog.products]);

  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      return;
    }

    const frame = requestAnimationFrame(() => setEntered(true));
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label="Menu główne"
    >
      <div
        className={`fixed inset-0 bg-shop-ink/30 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`relative z-10 w-[440px] max-w-full bg-shop-bg h-full border-r border-shop-line flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-out motion-reduce:transition-none ${
          entered ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Góra: Menu + zamknij */}
          <div className="px-6 md:px-8 h-20 border-b border-shop-line flex items-center justify-between">
            <span className="label text-shop-ink">Menu</span>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Zamknij menu"
              className="p-2 -mr-2 text-shop-ink hover:text-shop-bronze transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={1.25} />
            </button>
          </div>

          {/* Zakładki: Produkty / Kolekcje */}
          <div
            role="tablist"
            aria-label="Sekcje menu"
            className="px-6 md:px-8 border-b border-shop-line flex items-center gap-8"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "products"}
              onClick={() => setActiveTab("products")}
              className={`py-4 text-[12px] uppercase tracking-[0.16em] border-b transition-colors -mb-px ${
                activeTab === "products"
                  ? "border-shop-bronze text-shop-ink font-normal"
                  : "border-transparent text-shop-muted hover:text-shop-ink font-light"
              }`}
            >
              Produkty
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "collections"}
              onClick={() => setActiveTab("collections")}
              className={`py-4 text-[12px] uppercase tracking-[0.16em] border-b transition-colors -mb-px ${
                activeTab === "collections"
                  ? "border-shop-bronze text-shop-ink font-normal"
                  : "border-transparent text-shop-muted hover:text-shop-ink font-light"
              }`}
            >
              Kolekcje
            </button>
          </div>

          {/* Lista pozycji */}
          <nav className="px-6 md:px-8 py-2">
            {activeTab === "products" ? (
              <div>
                <Link
                  to="/sklep"
                  onClick={onClose}
                  className="group flex items-center justify-between py-5 border-b border-shop-line text-[17px] font-light text-shop-ink hover:text-shop-bronze transition-colors"
                >
                  <span className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transform-none">
                    Wszystkie produkty
                  </span>
                  <ChevronRight
                    className="w-4 h-4 text-shop-muted group-hover:text-shop-bronze shrink-0 transition-colors"
                    strokeWidth={1.25}
                  />
                </Link>

                {catalog.categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/sklep/${cat.slug}`}
                    onClick={onClose}
                    className="group flex items-center justify-between py-5 border-b border-shop-line text-[17px] font-light text-shop-ink hover:text-shop-bronze transition-colors"
                  >
                    <span className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transform-none">
                      {cat.name}{" "}
                      <span className="text-sm text-shop-muted ml-1">({cat.count})</span>
                    </span>
                    <ChevronRight
                      className="w-4 h-4 text-shop-muted group-hover:text-shop-bronze shrink-0 transition-colors"
                      strokeWidth={1.25}
                    />
                  </Link>
                ))}

                <Link
                  to="/zamowienia"
                  onClick={onClose}
                  className="group flex items-center justify-between py-5 border-b border-shop-line text-[17px] font-light text-shop-ink hover:text-shop-bronze transition-colors"
                >
                  <span className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transform-none">
                    Sprawdź zamówienie
                  </span>
                  <ChevronRight
                    className="w-4 h-4 text-shop-muted group-hover:text-shop-bronze shrink-0 transition-colors"
                    strokeWidth={1.25}
                  />
                </Link>
              </div>
            ) : (
              <div>
                {collections.length === 0 ? (
                  <p className="py-8 text-sm font-light text-shop-muted">
                    Brak przypisanych kolekcji w katalogu.
                  </p>
                ) : (
                  collections.map((col) => (
                    <Link
                      key={col}
                      to={`/sklep?q=${encodeURIComponent(col)}`}
                      onClick={onClose}
                      className="group flex items-center justify-between py-5 border-b border-shop-line text-[17px] font-light text-shop-ink hover:text-shop-bronze transition-colors"
                    >
                      <span className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transform-none">
                        {col}
                      </span>
                      <ChevronRight
                        className="w-4 h-4 text-shop-muted group-hover:text-shop-bronze shrink-0 transition-colors"
                        strokeWidth={1.25}
                      />
                    </Link>
                  ))
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Dolny stały blok: dane sprzedawcy */}
        <div className="px-6 md:px-8 py-6 border-t border-shop-line text-xs font-light text-shop-muted space-y-1">
          <p className="font-normal text-shop-ink">{shop.seller.companyName}</p>
          <p>
            <a
              href={`mailto:${shop.seller.email}`}
              className="hover:text-shop-ink transition-colors"
            >
              {shop.seller.email}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}