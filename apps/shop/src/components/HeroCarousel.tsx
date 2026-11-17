import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { BannerDto } from "@repo/shared";
import { resolveAssetUrl } from "../lib/api";

interface Props {
  banners: BannerDto[];
}

export function HeroCarousel({ banners }: Props) {
  const activeBanners = banners.filter((b) => b.isActive);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const count = activeBanners.length;

  const nextSlide = useCallback(() => {
    if (count <= 1) return;
    setIndex((prev) => (prev + 1) % count);
  }, [count]);

  const prevSlide = useCallback(() => {
    if (count <= 1) return;
    setIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (paused || reducedMotion || count <= 1) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [paused, reducedMotion, count, nextSlide]);

  if (count === 0) return null;

  const current = activeBanners[index] || activeBanners[0];
  const targetHref = current.targetUrlOrCollection.startsWith("/")
    ? current.targetUrlOrCollection
    : `/sklep?q=${encodeURIComponent(current.targetUrlOrCollection)}`;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promowane kolekcje"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") prevSlide();
        if (e.key === "ArrowRight") nextSlide();
      }}
      className="w-full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Lewy panel w kolorze głównym marki (granatowym) */}
        <div className="lg:col-span-4 bg-shop-navy text-white rounded-card p-8 md:p-12 flex flex-col justify-between min-h-[340px] md:min-h-[480px]">
          <div className="space-y-4 my-auto">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              {current.title}
            </h1>
            {current.subtitle && (
              <p className="text-sm md:text-base text-white/85 leading-relaxed">
                {current.subtitle}
              </p>
            )}
            <div className="pt-4">
              <Link
                to={targetHref}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-pill bg-white text-shop-navy font-medium text-xs md:text-sm hover:bg-shop-surface transition shadow-sm focus:outline-none focus:ring-2 focus:ring-white"
              >
                <span>{current.buttonText || "Zobacz kolekcję"}</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Kropki nawigacji z pierścieniem postępu dla aktywnej */}
          {count > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6" role="tablist">
              {activeBanners.map((b, i) => {
                const isActive = i === index;
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Slajd ${i + 1}: ${b.title}`}
                    onClick={() => setIndex(i)}
                    className="relative w-6 h-6 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white rounded-full"
                  >
                    {isActive && (
                      <span
                        className="absolute inset-0 rounded-full border-2 border-white"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`w-2 h-2 rounded-full transition-colors ${
                        isActive ? "bg-white" : "bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Prawy panel ze zdjęciem */}
        <div className="lg:col-span-8 bg-shop-surface rounded-card overflow-hidden min-h-[300px] md:min-h-[480px] relative">
          <img
            src={resolveAssetUrl(current.imageUrl)}
            alt={current.title}
            width={1100}
            height={520}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
