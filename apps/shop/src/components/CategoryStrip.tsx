import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { resolveAssetUrl } from "../lib/api";
import { ProductPlaceholderSvg } from "./ProductPlaceholderSvg";

interface CategoryItem {
  slug: string;
  name: string;
  count: number;
}

interface Props {
  categories: CategoryItem[];
  variant?: "text" | "tiles";
}

function toCategorySlug(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function CategoryStrip({ categories, variant = "text" }: Props) {
  const { kategoria } = useParams<{ kategoria?: string }>();
  const { catalog } = useShop();

  if (variant === "tiles") {
    if (categories.length === 0) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {categories.map((cat) => {
          const firstProduct = catalog.products.find(
            (p) => toCategorySlug(p.category) === cat.slug
          );
          const firstVariant = firstProduct?.variants[0];
          const mainImage =
            firstVariant?.images.find((img) => img.isMain) || firstVariant?.images[0];

          return (
            <Link
              key={cat.slug}
              to={`/sklep/${cat.slug}`}
              className="group flex flex-col"
            >
              <div className="aspect-[4/5] w-full bg-shop-surface rounded-none overflow-hidden flex items-center justify-center p-[12%] mb-4">
                {mainImage?.url ? (
                  <img
                    src={resolveAssetUrl(mainImage.url)}
                    alt={mainImage.alt || cat.name}
                    width={420}
                    height={525}
                    loading="lazy"
                    className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transform-none"
                  />
                ) : (
                  <ProductPlaceholderSvg
                    name={firstProduct?.name || cat.name}
                    colorHex={firstVariant?.swatchHex}
                    className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transform-none"
                  />
                )}
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-display text-[24px] font-normal tracking-[-0.01em] leading-[1.1] text-shop-ink group-hover:text-shop-bronze transition-colors">
                    {cat.name}
                  </h3>
                  <p className="label">{cat.count} prod.</p>
                </div>
                <ArrowUpRight
                  className="w-4 h-4 text-shop-muted group-hover:text-shop-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 mt-1.5 shrink-0 motion-reduce:transform-none"
                  strokeWidth={1.25}
                  aria-hidden="true"
                />
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav
      aria-label="Kategorie produktów"
      className="border-b border-shop-line py-4 mb-10"
    >
      <div className="flex items-center gap-7 md:gap-9 overflow-x-auto no-scrollbar">
        <Link
          to="/sklep"
          className={`shrink-0 pb-2 text-[12px] uppercase tracking-[0.16em] border-b transition-colors -mb-[17px] ${
            !kategoria
              ? "border-shop-bronze text-shop-ink font-normal"
              : "border-transparent text-shop-muted hover:text-shop-ink font-light"
          }`}
        >
          Wszystkie kategorie
        </Link>

        {categories.map((cat) => {
          const isActive = kategoria === cat.slug;
          return (
            <Link
              key={cat.slug}
              to={`/sklep/${cat.slug}`}
              className={`shrink-0 pb-2 text-[12px] uppercase tracking-[0.16em] border-b transition-colors -mb-[17px] ${
                isActive
                  ? "border-shop-bronze text-shop-ink font-normal"
                  : "border-transparent text-shop-muted hover:text-shop-ink font-light"
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}