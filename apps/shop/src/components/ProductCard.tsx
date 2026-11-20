import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import type { CatalogProduct } from "@repo/shared";
import { useShop } from "../context/ShopContext";
import { useFavoritesStore } from "../store/favoritesStore";
import { resolveAssetUrl } from "../lib/api";
import { formatGrosze } from "../lib/format";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { ProductPlaceholderSvg } from "./ProductPlaceholderSvg";

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

  const visibleSwatches = variants.slice(0, 5);
  const extraCount = Math.max(0, variants.length - 5);

  return (
    <article className="group flex flex-col">
      {/* Zdjęcie 4:5 na tle surface, radius 0, padding 10%, mix-blend-multiply */}
      <div className="relative aspect-[4/5] w-full bg-shop-surface rounded-none overflow-hidden mb-4">
        <Link
          to={productUrl}
          className="w-full h-full p-[10%] flex items-center justify-center"
        >
          {mainImage?.url ? (
            <img
              src={resolveAssetUrl(mainImage.url)}
              alt={mainImage.alt || product.name}
              width={420}
              height={525}
              loading="lazy"
              className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transform-none"
            />
          ) : (
            <ProductPlaceholderSvg
              name={product.name}
              colorHex={activeVariant.swatchHex}
              className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transform-none"
            />
          )}
        </Link>

        {/* Serce: małe, bez tła, na desktopie widoczne na hover (lub gdy ulubione) */}
        <button
          type="button"
          onClick={() => toggleFav(shop.slug, product.id)}
          aria-label={isFav ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
          className={`absolute top-3.5 right-3.5 p-1.5 transition-opacity duration-300 ${
            isFav
              ? "opacity-100"
              : "opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFav
                ? "fill-shop-bronze text-shop-bronze"
                : "text-shop-ink/70 hover:text-shop-ink"
            }`}
            strokeWidth={1.25}
          />
        </button>
      </div>

      {/* Nazwa po lewej, cena brutto po prawej (tabular-nums) i netto poniżej */}
      <div className="flex items-start justify-between gap-4">
        <Link
          to={productUrl}
          className="font-sans font-normal text-[15px] text-shop-ink hover:text-shop-bronze transition-colors leading-snug"
        >
          {product.name}
        </Link>
        <div className="text-right shrink-0">
          <p className="font-sans font-normal text-[15px] text-shop-ink tabular-nums whitespace-nowrap leading-snug">
            {formatGrosze(activeVariant.price.bruttoGrosze)}
          </p>
          <p className="text-[11px] font-light text-shop-muted tabular-nums whitespace-nowrap mt-0.5">
            {formatGrosze(activeVariant.price.nettoGrosze)} netto
          </p>
        </div>
      </div>

      {/* Kolekcja jako label uppercase muted */}
      {product.collection && (
        <p className="label mt-1.5">{product.collection}</p>
      )}

      {/* Status dostępności w trybie cichym */}
      <div className="mt-2.5">
        <AvailabilityBadge status={activeVariant.availability} />
      </div>

      {/* Próbki kolorów: koła 14px, do 5 + "+N" */}
      {visibleSwatches.length > 0 && (
        <div
          className="flex items-center gap-2.5 mt-3.5"
          role="radiogroup"
          aria-label="Wybór koloru"
        >
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
                className={`w-3.5 h-3.5 rounded-full border border-shop-ink/15 transition-shadow ${
                  isSelected
                    ? "ring-1 ring-shop-ink ring-offset-2 ring-offset-shop-bg"
                    : "hover:ring-1 hover:ring-shop-muted hover:ring-offset-1 hover:ring-offset-shop-bg"
                }`}
                style={{ backgroundColor: v.swatchHex || "#1C1A17" }}
              />
            );
          })}
          {extraCount > 0 && (
            <span className="text-[11px] font-light text-shop-muted tabular-nums">
              +{extraCount}
            </span>
          )}
        </div>
      )}
    </article>
  );
}