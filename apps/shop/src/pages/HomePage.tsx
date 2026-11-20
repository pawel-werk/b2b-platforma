import React, { useEffect } from "react";
import { useShop } from "../context/ShopContext";
import { HeroCarousel } from "../components/HeroCarousel";
import { CategoryStrip } from "../components/CategoryStrip";
import { ProductCarousel } from "../components/ProductCarousel";
import { TrustStrip } from "../components/TrustStrip";
import { Reveal } from "../components/Reveal";

export function HomePage() {
  const { shop, catalog } = useShop();

  useEffect(() => {
    document.title = `${shop.name} – Oficjalny sklep`;
  }, [shop.name]);

  return (
    <main className="max-w-[1520px] mx-auto px-6 md:px-10">
      <Reveal className="pt-6 md:pt-8 pb-10 md:pb-14">
        <HeroCarousel banners={catalog.banners} />
      </Reveal>

      {catalog.categories.length > 0 && (
        <Reveal className="py-20 md:py-28 border-t border-shop-line">
          <section aria-label="Kategorie produktów">
            <div className="mb-10 md:mb-12 space-y-2">
              <p className="label">Katalog</p>
              <h2 className="font-display font-normal text-[clamp(32px,3.6vw,52px)] tracking-[-0.01em] leading-[1.05] text-shop-ink">
                Kategorie
              </h2>
            </div>
            <CategoryStrip categories={catalog.categories} variant="tiles" />
          </section>
        </Reveal>
      )}

      <Reveal className="py-20 md:py-28 border-t border-shop-line">
        

<ProductCarousel title="Popularne produkty" products={catalog.products} />
      </Reveal>

      <Reveal className="py-20 md:py-28">
        <TrustStrip />
      </Reveal>
    </main>
  );
}