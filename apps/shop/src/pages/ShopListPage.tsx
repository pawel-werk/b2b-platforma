import React, { useMemo, useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { CategoryStrip } from "../components/CategoryStrip";
import { ProductCard } from "../components/ProductCard";

type SortOption = "name_asc" | "price_asc" | "price_desc";

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
    <main className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-16">
      <nav aria-label="Okruszki" className="text-xs text-shop-muted mb-4 flex items-center gap-2">
        <Link to="/" className="hover:text-shop-text">Strona główna</Link>
        <span>/</span>
        <Link to="/sklep" className="hover:text-shop-text">Sklep</Link>
        {activeCategoryObj && (
          <>
            <span>/</span>
            <span className="text-shop-text font-medium">{activeCategoryObj.name}</span>
          </>
        )}
      </nav>

      <CategoryStrip categories={catalog.categories} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-shop-border">
        <div>
          <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-shop-text">
            {activeCategoryObj ? activeCategoryObj.name : "Katalog produktów"}
          </h1>
          {query && (
            <div className="flex items-center gap-2 mt-2 text-sm text-shop-muted">
              <span>Fraza wyszukiwania: „{query}”</span>
              <button
                type="button"
                onClick={() => {
                  searchParams.delete("q");
                  setSearchParams(searchParams);
                }}
                className="text-xs font-semibold text-shop-accent underline"
              >
                Wyczyść
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-shop-text cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-4 h-4 rounded accent-shop-accent"
            />
            <span>Tylko dostępne od ręki</span>
          </label>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sortowanie produktów"
            className="border border-shop-border rounded-pill px-4 py-2 text-sm bg-white text-shop-text focus:outline-none focus:ring-2 focus:ring-shop-accent"
          >
            <option value="name_asc">Sortuj: Nazwa A–Z</option>
            <option value="price_asc">Sortuj: Cena rosnąco</option>
            <option value="price_desc">Sortuj: Cena malejąco</option>
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-shop-surface rounded-card mt-8 p-8 space-y-4">
          <p className="text-lg font-bold text-shop-text">
            Nie znaleziono produktów spełniających wybrane kryteria.
          </p>
          <p className="text-sm text-shop-muted">
            Zmień filtry dostępności lub przejdź do pełnego katalogu marki.
          </p>
          <Link
            to="/sklep"
            onClick={() => setOnlyAvailable(false)}
            className="inline-block px-6 py-2.5 rounded-pill bg-shop-accent text-white text-sm font-medium"
          >
            Pokaż wszystkie produkty
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
