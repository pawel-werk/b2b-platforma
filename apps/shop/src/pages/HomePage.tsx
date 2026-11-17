import React, { useEffect } from "react";
import { useShop } from "../context/ShopContext";
import { HeroCarousel } from "../components/HeroCarousel";
import { CategoryStrip } from "../components/CategoryStrip";
import { ProductCarousel } from "../components/ProductCarousel";

export function HomePage() {
  const { shop, catalog } = useShop();

  useEffect(() => {
    document.title = `${shop.name} – Oficjalny sklep`;
  }, [shop.name]);

  return (
    <main className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-12">
      <HeroCarousel banners={catalog.banners} />
      <CategoryStrip categories={catalog.categories} />
      

<ProductCarousel title="Popularne produkty" products={catalog.products} />
    </main>
  );
}
