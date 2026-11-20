import React, { useMemo, useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { CategoryStrip } from "../components/CategoryStrip";
import { ProductCard } from "../components/ProductCard";

type SortOption = "name_asc" | "price_asc" | "price_desc";

function formatResultCount(count: number): string {
  if (count === 1) return "1 produkt";
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} produkty`;
  }
  return `${count} produktów`;
}

export function ShopListPage() {
  const { kategoria } = useParams<{ kategoria?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { shop, catalog } = useShop();

  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");

  const query = searchParams.get("q")?.trim() || "";

  const activeCategoryObj = catalog.categories.find((c) => c.slug === kategoria);

  useEffect(() => {
    const titlePrefix = activeCategoryObj
      ? activeCategoryObj.name
      : query
      ? `Wyniki dla "${query}"`
      : "Wszystkie produkty";
    document.title = `${titlePrefix} | ${shop.name}`;
  }, [activeCategoryObj, query, shop.name]);

  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase();

    const list = catalog.products.filter((p) => {
      if (kategoria) {
        const pCatSlug = p.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        if (pCatSlug !== kategoria) return false;
      }

      if (onlyAvailable) {
        const hasAvail = p.variants.some((v) => v.availability === "available");
        if (!hasAvail) return false;
      }

      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchColl = (p.collection || "").toLowerCase().includes(q);
        const matchVar = p.variants.some(
          (v) => v.symbol.toLowerCase().includes(q) || v.ean.toLowerCase().includes(q)
        );
        if (!matchName && !matchColl && !matchVar) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      const priceA = a.variants[0]?.price.bruttoGrosze ?? 0;
      const priceB = b.variants[0]?.price.bruttoGrosze ?? 0;
      if (sortBy === "price_asc") return priceA - priceB;
      if (sortBy === "price_desc") return priceB - priceA;
      return a.name.localeCompare(b.name, "pl");
    });
  }, [catalog.products, kategoria, onlyAvailable, query, sortBy]);

  return (
    <main className="max-w-[1520px] mx-auto px-6 md:px-10 pt-8 md:pt-12 pb-20 md:pb-28">
      {/* Okruszki */}
      <nav
        aria-label="Okruszki"
        className="text-[12px] font-light text-shop-muted mb-6 flex flex-wrap items-center gap-2"
      >
        <Link to="/" className="hover:text-shop-ink transition-colors">
          Strona główna
        </Link>
        <span className="text-shop-line" aria-hidden="true">/</span>
        <Link to="/sklep" className="hover:text-shop-ink transition-colors">
          Sklep
        </Link>
        {activeCategoryObj && (
          <>
            <span className="text-shop-line" aria-hidden="true">/</span>
            <span className="text-shop-ink font-normal">{activeCategoryObj.name}</span>
          </>
        )}
      </nav>

      {/* Nagłówek H1 + opcjonalna fraza wyszukiwania */}
      <header className="mb-8 space-y-3">
        <h1 className="font-display font-normal text-[clamp(36px,4vw,56px)] tracking-[-0.01em] leading-[1.05] text-shop-ink">
          {activeCategoryObj ? activeCategoryObj.name : "Katalog produktów"}
        </h1>
        {query && (
          <div className="flex flex-wrap items-center gap-3 text-sm font-light text-shop-muted">
            <span>Fraza wyszukiwania: „{query}”</span>
            <button
              type="button"
              onClick={() => {
                searchParams.delete("q");
                setSearchParams(searchParams);
              }}
              className="text-xs uppercase tracking-[0.14em] text-shop-ink underline underline-offset-4 decoration-shop-line hover:decoration-shop-ink transition-colors"
            >
              Wyczyść
            </button>
          </div>
        )}
      </header>

      {/* Slim pasek kategorii */}
      <CategoryStrip categories={catalog.categories} variant="text" />

      {/* Pasek narzędzi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-shop-line">
        <p className="label tabular-nums">{formatResultCount(filteredProducts.length)}</p>

        <div className="flex flex-wrap items-center gap-6 md:gap-8">
          <label className="inline-flex items-center gap-2.5 text-sm font-light text-shop-ink cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-3.5 h-3.5 rounded-none accent-shop-ink"
            />
            <span>Tylko dostępne od ręki</span>
          </label>

          <div className="relative inline-flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sortowanie produktów"
              className="appearance-none bg-transparent border-0 border-b border-shop-line focus:border-shop-bronze focus:outline-none rounded-none py-1.5 pr-7 text-sm font-light text-shop-ink cursor-pointer transition-colors"
            >
              <option value="name_asc">Sortuj: Nazwa A–Z</option>
              <option value="price_asc">Sortuj: Cena rosnąco</option>
              <option value="price_desc">Sortuj: Cena malejąco</option>
            </select>
            <ChevronDown
              className="w-4 h-4 text-shop-muted pointer-events-none absolute right-0"
              strokeWidth={1.25}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Siatka produktów lub pusty stan */}
      {filteredProducts.length === 0 ? (
        <div className="py-24 md:py-32 text-center max-w-lg mx-auto space-y-4">
          <p className="font-display text-2xl md:text-3xl font-normal tracking-[-0.01em] leading-[1.15] text-shop-ink">
            Nie znaleziono produktów spełniających wybrane kryteria.
          </p>
          <p className="text-sm font-light text-shop-muted leading-relaxed">
            Zmień filtry dostępności lub przejdź do pełnego katalogu marki.
          </p>
          <div className="pt-2">
            <Link
              to="/sklep"
              onClick={() => setOnlyAvailable(false)}
              className="text-[12px] uppercase tracking-[0.14em] text-shop-ink underline underline-offset-4 decoration-shop-line hover:decoration-shop-ink transition-colors"
            >
              Pokaż wszystkie produkty
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-14 mt-10">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}