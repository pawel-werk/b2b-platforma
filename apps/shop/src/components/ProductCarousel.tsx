import React, { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { CatalogProduct } from "@repo/shared";
import { ProductCard } from "./ProductCard";

interface Props {
  title: string;
  products: CatalogProduct[];
}

export function ProductCarousel({ title, products }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scrollByAmount = (dir: "left" | "right") => {
    if (!trackRef.current) return;
    const width = trackRef.current.clientWidth;
    trackRef.current.scrollBy({
      left: dir === "left" ? -width * 0.75 : width * 0.75,
      behavior: "smooth",
    });
  };

  return (
    <section
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") scrollByAmount("left");
        if (e.key === "ArrowRight") scrollByAmount("right");
      }}
      className="py-8 md:py-12 relative"
    >
      <div className="flex items-center justify-between gap-4 mb-8">
        <h2 className="text-[32px] md:text-[44px] font-normal tracking-tight text-shop-text leading-none">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            aria-label="Poprzednie produkty"
            className="p-2.5 rounded-full text-shop-text hover:bg-shop-surface transition focus:outline-none focus:ring-2 focus:ring-shop-accent"
          >
            <ArrowLeft className="w-6 h-6 stroke-[1.5]" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            aria-label="Następne produkty"
            className="p-2.5 rounded-full text-shop-text hover:bg-shop-surface transition focus:outline-none focus:ring-2 focus:ring-shop-accent"
          >
            <ArrowRight className="w-6 h-6 stroke-[1.5]" />
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Strzałki pomocnicze na wysokości zdjęć (jak na wzorze BOCCO) */}
        <button
          type="button"
          onClick={() => scrollByAmount("left")}
          aria-label="Przewiń w lewo"
          className="hidden md:flex items-center justify-center absolute left-3 top-[38%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-shop-text shadow-sm transition"
        >
          <ArrowLeft className="w-5 h-5 stroke-[1.5]" />
        </button>

        <button
          type="button"
          onClick={() => scrollByAmount("right")}
          aria-label="Przewiń w prawo"
          className="hidden md:flex items-center justify-center absolute right-3 top-[38%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-shop-text shadow-sm transition"
        >
          <ArrowRight className="w-5 h-5 stroke-[1.5]" />
        </button>

        <div
          ref={trackRef}
          tabIndex={0}
          className="grid grid-flow-col auto-cols-[80%] sm:auto-cols-[46%] lg:auto-cols-[23.5%] gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-2 focus:outline-none"
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
