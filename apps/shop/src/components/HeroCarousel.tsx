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
      <style>{`
        @keyframes heroProgressFill {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes heroSlowZoom {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-none border border-shop-line">
        {/* Lewy panel 4/12: surface-deep z tekstem ink */}
        <div className="lg:col-span-4 bg-shop-surfaceDeep text-shop-ink p-8 md:p-12 xl:p-14 flex flex-col justify-between min-h-[380px] lg:min-h-[min(78vh,760px)]">
          <div className="space-y-6 my-auto">
            <h1 className="font-display font-normal text-[clamp(40px,4.6vw,72px)] leading-[1.02] tracking-[-0.01em] text-shop-ink">
              {current.title}
            </h1>
            {current.subtitle && (
              <p className="font-sans font-light text-[16px] text-shop-ink/75 max-w-[38ch] leading-relaxed">
                {current.subtitle}
              </p>
            )}
            <div className="pt-4">
              <Link
                to={targetHref}
                className="inline-flex h-12 items-center justify-center gap-2.5 px-7 rounded-[2px] border border-shop-ink bg-shop-ink text-shop-bg text-[12px] font-normal uppercase tracking-[0.14em] transition-colors duration-300 hover:bg-transparent hover:text-shop-ink"
              >
                <span>{current.buttonText || "Zobacz kolekcję"}</span>
                <ArrowUpRight className="w-4 h-4" strokeWidth={1.25} />
              </Link>
            </div>
          </div>

          {/* Cienkie poziome kreski 24px x 1px z postępem autoplay */}
          {count > 1 && (
            <div
              className="flex items-center gap-3 pt-10"
              role="tablist"
              aria-label="Wybór slajdu"
            >
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
                    className="py-3 px-0.5 flex items-center"
                  >
                    <span className="relative block w-6 h-px bg-shop-ink/25 overflow-hidden">
                      {isActive && (
                        <span
                          key={`progress-${index}`}
                          aria-hidden="true"
                          className="absolute inset-0 bg-shop-ink origin-left"
                          style={
                            reducedMotion
                              ? undefined
                              : {
                                  animation: "heroProgressFill 6000ms linear forwards",
                                  animationPlayState: paused ? "paused" : "running",
                                }
                          }
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Prawy panel 8/12: wszystkie zdjęcia ułożone na sobie z crossfade 900ms i powolnym zoomem 8s */}
        <div className="lg:col-span-8 bg-shop-surface overflow-hidden min-h-[340px] sm:min-h-[440px] lg:min-h-[min(78vh,760px)] relative">
          {activeBanners.map((banner, i) => {
            const isActive = i === index;
            return (
              <div
                key={banner.id}
                aria-hidden={!isActive}
                className={`absolute inset-0 transition-opacity duration-[900ms] ease-out motion-reduce:transition-none ${
                  isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <img
                  src={resolveAssetUrl(banner.imageUrl)}
                  alt={banner.title}
                  width={1100}
                  height={520}
                  className="w-full h-full object-cover"
                  style={
                    isActive && !reducedMotion
                      ? {
                          animation: "heroSlowZoom 8000ms ease-out forwards",
                          animationPlayState: paused ? "paused" : "running",
                        }
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}