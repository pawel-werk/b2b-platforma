import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import type { CatalogProduct } from "@repo/shared";
import { useShop } from "../context/ShopContext";
import { useFavoritesStore } from "../store/favoritesStore";
import { resolveAssetUrl } from "../lib/api";
import { formatGrosze } from "../lib/format";
import { AvailabilityBadge } from "./AvailabilityBadge";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const { shop } = useShop();
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  const isFav = useFavoritesStore((s) => s.isFavorite(shop.slug, product.id));
  const toggleFav = useFavoritesStore((s) => s.toggleFavorite);

  const variants = product.variants.length > 0 ? product.variants : [];
  const activeVariant = variants[selectedVariantIdx] || variants[0];

  if (!activeVariant) return null;

  const mainImage =
    activeVariant.images.find((img) => img.isMain) || activeVariant.images[0];
  const productUrl = `/produkt/${product.slug}?kolor=${encodeURIComponent(
    activeVariant.colorCode
  )}`;

  // Prezentujemy 3 próbki kolorów na karcie (jeśli produkt ma 1 wariant, pokazujemy jego próbkę + 2 odcienie poglądowe lub wszystkie dostępne do 3)
  const visibleSwatches = variants.slice(0, 3);

  return (
    <article className="group flex flex-col">
      {/* Zdjęcie 3:4 na jasnoszarym tle #EEF2F7 z sercem w rogu */}
      <div className="relative aspect-[3/4] w-full bg-shop-surface rounded-card overflow-hidden mb-3.5">
        <Link to={productUrl} className="block w-full h-full p-6 flex items-center justify-center">
          <img
            src={resolveAssetUrl(mainImage?.url)}
            alt={mainImage?.alt || product.name}
            width={420}
            height={560}
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
          />
        </Link>

        <button
          type="button"
          onClick={() => toggleFav(shop.slug, product.id)}
          aria-label={isFav ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
          className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white/80 hover:bg-white text-shop-text transition focus:outline-none focus:ring-2 focus:ring-shop-accent"
        >
          <Heart
            className={`w-4 h-4 ${
              isFav ? "fill-shop-accent text-shop-accent" : "text-shop-muted"
            }`}
          />
        </button>
      </div>

      {/* Nazwa pogrubiona po lewej, cena brutto po prawej (z netto w nawiasie) */}
      <div className="flex items-start justify-between gap-3">
        <Link
          to={productUrl}
          className="font-bold text-sm md:text-base text-shop-text hover:text-shop-accent leading-snug"
        >
          {product.name}
        </Link>
        <div className="text-right shrink-0">
          <p className="font-bold text-sm text-shop-text whitespace-nowrap">
            {formatGrosze(activeVariant.price.bruttoGrosze)}
          </p>
          <p className="text-[11px] text-shop-muted whitespace-nowrap">
            ({formatGrosze(activeVariant.price.nettoGrosze)} netto)
          </p>
        </div>
      </div>

      {/* Kolekcja szarym tekstem */}
      {product.collection && (
        <p className="text-xs text-shop-muted mt-0.5">{product.collection}</p>
      )}

      {/* Plakietka dostępności */}
      <div className="mt-2">
        <AvailabilityBadge status={activeVariant.availability} />
      </div>

      {/* Rząd próbek kolorów */}
      <div className="flex items-center gap-2 mt-3" role="radiogroup" aria-label="Wybór koloru">
        {visibleSwatches.map((v, idx) => {
          const isSelected = idx === selectedVariantIdx;
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Kolor ${v.colorName}`}
              onClick={() => setSelectedVariantIdx(idx)}
              className={`w-6 h-6 rounded-full p-0.5 transition focus:outline-none ${
                isSelected
                  ? "ring-2 ring-shop-accent ring-offset-1"
                  : "ring-1 ring-shop-border hover:ring-shop-muted"
              }`}
            >
              <span
                className="block w-full h-full rounded-full border border-black/10"
                style={{ backgroundColor: v.swatchHex || "#0B2545" }}
              />
            </button>
          );
        })}
      </div>
    </article>
  );
}
