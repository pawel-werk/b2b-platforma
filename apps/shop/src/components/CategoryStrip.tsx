import React from "react";
import { Link, useParams } from "react-router-dom";
import { LayoutGrid, Droplets, Sparkles, Box, Layers, ShieldCheck, Wrench } from "lucide-react";

interface CategoryItem {
  slug: string;
  name: string;
  count: number;
}

const ICONS = [Droplets, Sparkles, Box, Layers, ShieldCheck, Wrench];

export function CategoryStrip({ categories }: { categories: CategoryItem[] }) {
  const { kategoria } = useParams<{ kategoria?: string }>();

  return (
    <section aria-label="Kategorie produktów" className="py-8 md:py-12">
      <div className="flex items-start gap-6 md:gap-8 overflow-x-auto no-scrollbar pb-2">
        <Link
          to="/sklep"
          className="group flex flex-col items-center gap-3 shrink-0 w-24 md:w-28 text-center focus:outline-none"
        >
          <div
            className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition border ${
              !kategoria
                ? "bg-shop-surface border-shop-accent text-shop-navy"
                : "bg-shop-surface border-transparent text-shop-text group-hover:border-shop-border"
            }`}
          >
            <LayoutGrid className="w-6 h-6 stroke-[1.5]" />
          </div>
          <span className="text-xs font-medium text-shop-text leading-tight">
            Wszystkie kategorie
          </span>
        </Link>

        {categories.map((cat, idx) => {
          const IconComponent = ICONS[idx % ICONS.length];
          const isActive = kategoria === cat.slug;
          return (
            <Link
              key={cat.slug}
              to={`/sklep/${cat.slug}`}
              className="group flex flex-col items-center gap-3 shrink-0 w-24 md:w-28 text-center focus:outline-none"
            >
              <div
                className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition border ${
                  isActive
                    ? "bg-shop-surface border-shop-accent text-shop-navy"
                    : "bg-shop-surface border-transparent text-shop-text group-hover:border-shop-border"
                }`}
              >
                <IconComponent className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-xs font-medium text-shop-text leading-tight">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
