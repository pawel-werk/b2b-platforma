import React, { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { CatalogProduct } from "@repo/shared";
import { ProductCard } from "./ProductCard";

interface Props {
  title: string;
  products: CatalogProduct[];
}

export function ProductCarousel({ title, products }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateScrollProgress = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 1) {
      setHasOverflow(false);
      setProgress(1);
      return;
    }
    setHasOverflow(true);
    setProgress(Math.min(1, Math.max(0, el.scrollLeft / maxScroll)));
  }, []);

  useEffect(() => {
    updateScrollProgress();
    window.addEventListener("resize", updateScrollProgress);
    return () => window.removeEventListener("resize", updateScrollProgress);
  }, [updateScrollProgress, products.length]);

  if (products.length === 0) return null;

  const scrollByAmount = (dir: "left" | "right") => {
    if (!trackRef.current) return;
    const width = trackRef.current.clientWidth;
    trackRef.current.scrollBy({
      left: dir === "left" ? -width * 0.75 : width * 0.75,
      behavior: "smooth",
    });
  };

  // Minimalna widoczna część paska (np. 20%), aby na pozycji 0 był subtelnie zarysowany
  const barPercent = hasOverflow ? Math.max(15, progress * 100) : 100;

  return (
    <section
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") scrollByAmount("left");
        if (e.key === "ArrowRight") scrollByAmount("right");
      }}
      className="relative"
    >
      <div className="flex items-end justify-between gap-6 mb-10 md:mb-12">
        <h2 className="font-display font-normal text-[clamp(32px,3.6vw,52px)] tracking-[-0.01em] leading-[1.05] text-shop-ink">
          {title}
        </h2>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            aria-label="Poprzednie produkty"
            className="w-11 h-11 rounded-[2px] border border-shop-line flex items-center justify-center text-shop-ink hover:border-shop-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.25} />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            aria-label="Następne produkty"
            className="w-11 h-11 rounded-[2px] border border-shop-line flex items-center justify-center text-shop-ink hover:border-shop-ink transition-colors"
          >
            <ArrowRight className="w-4 h-4" strokeWidth={1.25} />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        tabIndex={0}
        onScroll={updateScrollProgress}
        className="grid grid-flow-col auto-cols-[80%] sm:auto-cols-[46%] lg:auto-cols-[23.5%] gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2"
      >
        {products.map((p) => (
          <div key={p.id} className="snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {/* Cienki pasek postępu przewijania */}
      {hasOverflow && (
        <div
          aria-hidden="true"
          className="mt-8 h-px w-full bg-shop-line relative overflow-hidden"
        >
          <div
            className="h-full bg-shop-ink transition-[width] duration-200 ease-out motion-reduce:transition-none"
            style={{ width: `${barPercent}%` }}
          />
        </div>
      )}
    </section>
  );
}