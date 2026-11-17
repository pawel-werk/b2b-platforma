import React, { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Share2, Heart, Minus, Plus } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { useCartStore } from "../store/cartStore";
import { useFavoritesStore } from "../store/favoritesStore";
import { useToastStore } from "../store/toastStore";
import { resolveAssetUrl } from "../lib/api";
import { formatGrosze } from "../lib/format";
import { AvailabilityBadge } from "../components/AvailabilityBadge";
import { LightboxModal } from "../components/LightboxModal";
import { TechnicalDocsAccordion } from "../components/TechnicalDocsAccordion";
import { ProductCarousel } from "../components/ProductCarousel";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { shop, catalog } = useShop();

  const product = catalog.products.find((p) => p.slug === slug || p.id === slug);

  const colorParam = searchParams.get("kolor");
  const activeVariant = useMemo(() => {
    if (!product) return null;
    if (colorParam) {
      const found = product.variants.find(
        (v) => v.colorCode.toLowerCase() === colorParam.toLowerCase()
      );
      if (found) return found;
    }
    return product.variants[0] || null;
  }, [product, colorParam]);

  const [quantity, setQuantity] = useState(1);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const isFav = useFavoritesStore((s) =>
    product ? s.isFavorite(shop.slug, product.id) : false
  );
  const toggleFav = useFavoritesStore((s) => s.toggleFavorite);
  const pushToast = useToastStore((s) => s.pushToast);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | ${shop.name}`;
    }
  }, [product, shop.name]);

  if (!product || !activeVariant) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-shop-text">Nie znaleziono produktu</h1>
        <Link
          to="/sklep"
          className="inline-block px-6 py-3 rounded-pill bg-shop-accent text-white text-sm font-medium"
        >
          Wróć do sklepu
        </Link>
      </main>
    );
  }

  const categorySlug = product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const images = activeVariant.images.length > 0 ? activeVariant.images : [];

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url: shareUrl });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(shareUrl);
    pushToast({ title: "Skopiowano link do produktu do schowka." });
  };

  const handleAddToCart = () => {
    if (activeVariant.availability === "unavailable") return;
    addItem(
      shop.slug,
      {
        variantId: activeVariant.id,
        productSlug: product.slug,
        productName: product.name,
        collection: product.collection,
        category: product.category,
        symbol: activeVariant.symbol,
        ean: activeVariant.ean,
        colorName: activeVariant.colorName,
        colorCode: activeVariant.colorCode,
        swatchHex: activeVariant.swatchHex,
        imageUrl: images[0]?.url || "/logo-IT.png",
        nettoGrosze: activeVariant.price.nettoGrosze,
        vatRate: activeVariant.price.vatRate,
        bruttoGrosze: activeVariant.price.bruttoGrosze,
        availability: activeVariant.availability,
      },
      quantity
    );
    pushToast({
      title: `Dodano do koszyka (${quantity} szt.)`,
      description: `${product.name} – ${activeVariant.colorName}`,
      showCartLink: true,
    });
  };

  const similarProducts = catalog.products.filter(
    (p) => p.category === product.category && p.id !== product.id
  );

  return (
    <main className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-16">
      {/* Okruszki: Strona główna / Sklep / Kategoria / Produkt */}
      <nav aria-label="Okruszki" className="text-xs text-shop-muted mb-6 flex flex-wrap items-center gap-1.5">
        <Link to="/" className="hover:text-shop-text">Strona główna</Link>
        <span>/</span>
        <Link to="/sklep" className="hover:text-shop-text">Sklep</Link>
        <span>/</span>
        <Link to={`/sklep/${categorySlug}`} className="hover:text-shop-text">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-shop-text font-medium">{product.name}</span>
      </nav>

      {/* Główny układ: Lewa galeria + Prawa kolumna zakupowa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-16">
        {/* Lewa strona: Galeria w układzie BOCCO (2 duże u góry, niżej mniejsze) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(images.slice(0, 2).length === 1 ? [images[0], images[0]] : images.slice(0, 2)).map(
              (img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIdx(idx)}
                  className="aspect-[3/4] bg-shop-surface rounded-card overflow-hidden p-6 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-shop-accent"
                >
                  <img
                    src={resolveAssetUrl(img.url)}
                    alt={img.alt || product.name}
                    width={520}
                    height={680}
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                  />
                </button>
              )
            )}
          </div>

          {images.length > 2 && (
            <div className="grid grid-cols-3 gap-4">
              {images.slice(2).map((img, i) => (
                <button
                  key={i + 2}
                  type="button"
                  onClick={() => setLightboxIdx(i + 2)}
                  className="aspect-square bg-shop-surface rounded-card overflow-hidden p-4 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-shop-accent"
                >
                  <img
                    src={resolveAssetUrl(img.url)}
                    alt={img.alt || product.name}
                    width={300}
                    height={300}
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Prawa strona: Informacje i konfiguracja wariantu */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-shop-text leading-snug">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShare}
                aria-label="Udostępnij produkt"
                className="w-10 h-10 rounded-full bg-shop-surface hover:bg-shop-border/60 flex items-center justify-center text-shop-text transition"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => toggleFav(shop.slug, product.id)}
                aria-label={isFav ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                className="w-10 h-10 rounded-full bg-shop-surface hover:bg-shop-border/60 flex items-center justify-center text-shop-text transition"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFav ? "fill-shop-accent text-shop-accent" : "text-shop-text"
                  }`}
                />
              </button>
            </div>
          </div>

          <p className="text-xs text-shop-muted">
            SKU: {activeVariant.symbol}
            {activeVariant.ean ? `, EAN: ${activeVariant.ean}` : ""}
          </p>

          {product.collection && (
            <p className="text-sm font-medium text-shop-text">{product.collection}</p>
          )}

          {/* Cena brutto dużą czcionką + netto w nawiasie */}
          <div className="pt-1">
            <p className="text-3xl font-bold text-shop-text">
              {formatGrosze(activeVariant.price.bruttoGrosze)}
            </p>
            <p className="text-xs text-shop-muted mt-1">
              ({formatGrosze(activeVariant.price.nettoGrosze)} netto, VAT {activeVariant.price.vatRate}%)
            </p>
          </div>

          {product.description && (
            <p className="text-sm text-shop-muted leading-relaxed">{product.description}</p>
          )}

          {/* Plakietka dostępności z notatką terminu dla on_order */}
          <div>
            <AvailabilityBadge
              status={activeVariant.availability}
              leadTimeNote={activeVariant.leadTimeNote}
              showNote
            />
          </div>

          {/* Wybór koloru: "Kolor: nazwa (KOD)" i próbki */}
          <div className="pt-4 border-t border-shop-border space-y-3">
            <p className="text-xs font-medium text-shop-text">
              <span className="font-bold">Kolor:</span> {activeVariant.colorName} (
              {activeVariant.colorCode})
            </p>
            <div className="flex items-center gap-3">
              {product.variants.map((v) => {
                const isSelected = v.id === activeVariant.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSearchParams({ kolor: v.colorCode })}
                    aria-label={`Wybierz kolor ${v.colorName} (${v.colorCode})`}
                    className={`w-8 h-8 rounded-full p-0.5 transition ${
                      isSelected
                        ? "ring-2 ring-shop-accent ring-offset-2"
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
          </div>

          {/* Selektor ilości w kształcie pigułki + niebieski przycisk Dodaj do koszyka */}
          <div className="pt-4 border-t border-shop-border flex items-center gap-4">
            <div className="inline-flex items-center border border-shop-border rounded-pill px-3 py-2 bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Zmniejsz ilość"
                className="p-1.5 text-shop-text hover:text-shop-accent"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-sm font-bold text-shop-text">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Zwiększ ilość"
                className="p-1.5 text-shop-text hover:text-shop-accent"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              disabled={activeVariant.availability === "unavailable"}
              onClick={handleAddToCart}
              className={`flex-1 py-3.5 px-8 rounded-pill font-bold text-sm transition focus:outline-none focus:ring-2 focus:ring-shop-accent focus:ring-offset-2 ${
                activeVariant.availability === "unavailable"
                  ? "bg-shop-surface text-shop-muted cursor-not-allowed"
                  : "bg-shop-accent hover:bg-shop-navy text-white shadow-sm"
              }`}
            >
              {activeVariant.availability === "unavailable"
                ? "Niedostępny"
                : "Dodaj do koszyka"}
            </button>
          </div>
        </div>
      </div>

      {/* Pełny opis */}
      {product.description && (
        <section className="py-10 border-t border-shop-border max-w-3xl space-y-3">
          <h2 className="text-xl font-bold text-shop-text">Opis produktu</h2>
          <p className="text-sm md:text-base text-shop-muted leading-relaxed">
            {product.description}
          </p>
        </section>
      )}

      {/* Sekcja Dokumentacja techniczna (znika automatycznie, gdy brak plików) */}
      <TechnicalDocsAccordion files={activeVariant.files} />

      {/* Karuzela Podobne produkty z tej samej kategorii */}
      

<ProductCarousel title="Podobne produkty" products={similarProducts} />

      {lightboxIdx !== null && (
        <LightboxModal
          images={images}
          activeIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onSelect={(idx) => setLightboxIdx(idx)}
        />
      )}
    </main>
  );
}
