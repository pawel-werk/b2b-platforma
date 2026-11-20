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
import { ProductPlaceholderSvg } from "../components/ProductPlaceholderSvg";

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
  const [openDesc, setOpenDesc] = useState(true);
  const [openDelivery, setOpenDelivery] = useState(false);

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
      <main className="max-w-[1520px] mx-auto px-6 md:px-10 py-24 md:py-32 text-center space-y-6">
        <h1 className="font-display font-normal text-[clamp(36px,4vw,56px)] tracking-[-0.01em] leading-[1.05] text-shop-ink">
          Nie znaleziono produktu
        </h1>
        <div>
          <Link
            to="/sklep"
            className="inline-flex h-12 items-center justify-center px-8 rounded-[2px] border border-shop-ink bg-shop-ink text-shop-bg text-[12px] font-normal uppercase tracking-[0.14em] transition-colors duration-300 hover:bg-transparent hover:text-shop-ink"
          >
            Wróć do sklepu
          </Link>
        </div>
      </main>
    );
  }

  const categorySlug = product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const images = activeVariant.images.length > 0 ? activeVariant.images : [];
  const enabledMethods = shop.deliverySettings.methods.filter((m) => m.enabled);
  const freeShippingThreshold = shop.deliverySettings.freeShippingThresholdGrossGrosze;

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

  const topImages =
    images.length === 0
      ? []
      : images.slice(0, 2).length === 1
      ? [images[0], images[0]]
      : images.slice(0, 2);

  return (
    <main className="max-w-[1520px] mx-auto px-6 md:px-10 pt-8 md:pt-12 pb-20 md:pb-28">
      {/* Okruszki */}
      <nav
        aria-label="Okruszki"
        className="text-[12px] font-light text-shop-muted mb-8 flex flex-wrap items-center gap-2"
      >
        <Link to="/" className="hover:text-shop-ink transition-colors">
          Strona główna
        </Link>
        <span className="text-shop-line" aria-hidden="true">/</span>
        <Link to="/sklep" className="hover:text-shop-ink transition-colors">
          Sklep
        </Link>
        <span className="text-shop-line" aria-hidden="true">/</span>
        <Link
          to={`/sklep/${categorySlug}`}
          className="hover:text-shop-ink transition-colors"
        >
          {product.category}
        </Link>
        <span className="text-shop-line" aria-hidden="true">/</span>
        <span className="text-shop-ink font-normal">{product.name}</span>
      </nav>

      {/* Układ 7/5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Lewa kolumna: galeria */}
        <div className="lg:col-span-7 space-y-4">
          {topImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIdx(images.length === 1 ? 0 : idx)}
                  aria-label={`Powiększ zdjęcie ${idx + 1}: ${img.alt || product.name}`}
                  className="group aspect-[4/5] w-full bg-shop-surface rounded-none overflow-hidden p-[10%] flex items-center justify-center"
                >
                  <img
                    src={resolveAssetUrl(img.url)}
                    alt={img.alt || product.name}
                    width={520}
                    height={650}
                    className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transform-none"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="aspect-[4/5] w-full bg-shop-surface rounded-none flex items-center justify-center p-[10%]">
              <ProductPlaceholderSvg
                name={product.name}
                colorHex={activeVariant.swatchHex}
                colorLabel={activeVariant.colorName}
              />
            </div>
          )}

          {images.length > 2 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {images.slice(2).map((img, i) => (
                <button
                  key={i + 2}
                  type="button"
                  onClick={() => setLightboxIdx(i + 2)}
                  aria-label={`Powiększ zdjęcie ${i + 3}: ${img.alt || product.name}`}
                  className="group aspect-[4/5] w-full bg-shop-surface rounded-none overflow-hidden p-[10%] flex items-center justify-center"
                >
                  <img
                    src={resolveAssetUrl(img.url)}
                    alt={img.alt || product.name}
                    width={300}
                    height={375}
                    loading="lazy"
                    className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transform-none"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Prawa kolumna: sticky */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
          {/* Kolekcja + akcje */}
          <div className="flex items-center justify-between gap-4">
            <p className="label">{product.collection || product.category}</p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleShare}
                aria-label="Udostępnij produkt"
                className="p-1.5 text-shop-ink hover:text-shop-bronze transition-colors"
              >
                <Share2 className="w-4 h-4" strokeWidth={1.25} />
              </button>
              <button
                type="button"
                onClick={() => toggleFav(shop.slug, product.id)}
                aria-label={isFav ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                className="p-1.5 text-shop-ink hover:text-shop-bronze transition-colors"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isFav ? "fill-shop-bronze text-shop-bronze" : "text-shop-ink"
                  }`}
                  strokeWidth={1.25}
                />
              </button>
            </div>
          </div>

          {/* Tytuł + SKU/EAN */}
          <div className="space-y-2">
            <h1 className="font-display font-normal text-[34px] md:text-[40px] tracking-[-0.01em] leading-[1.05] text-shop-ink">
              {product.name}
            </h1>
            <p className="text-[12px] font-light text-shop-muted tabular-nums">
              SKU: {activeVariant.symbol}
              {activeVariant.ean ? ` · EAN: ${activeVariant.ean}` : ""}
            </p>
          </div>

          {/* Cena */}
          <div className="pt-1 space-y-1">
            <p className="font-display font-normal text-[32px] md:text-[36px] tracking-[-0.01em] leading-[1.05] text-shop-ink tabular-nums">
              {formatGrosze(activeVariant.price.bruttoGrosze)}
            </p>
            <p className="text-[12px] font-light text-shop-muted tabular-nums">
              {formatGrosze(activeVariant.price.nettoGrosze)} netto · VAT {activeVariant.price.vatRate}%
            </p>
          </div>

          {/* Krótki opis */}
          {product.description && (
            <p className="text-sm font-light text-shop-muted leading-relaxed max-w-[60ch]">
              {product.description}
            </p>
          )}

          {/* Status dostępności */}
          <div>
            <AvailabilityBadge
              status={activeVariant.availability}
              leadTimeNote={activeVariant.leadTimeNote}
              showNote
            />
          </div>

          {/* Wybór koloru: próbki 28px z ringiem */}
          <div className="pt-6 border-t border-shop-line space-y-3.5">
            <p className="text-xs font-light text-shop-ink">
              <span className="label mr-2">Kolor</span>
              {activeVariant.colorName} ({activeVariant.colorCode})
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {product.variants.map((v) => {
                const isSelected = v.id === activeVariant.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSearchParams({ kolor: v.colorCode })}
                    aria-label={`Wybierz kolor ${v.colorName} (${v.colorCode})`}
                    className={`w-7 h-7 rounded-full border border-shop-ink/15 transition-shadow ${
                      isSelected
                        ? "ring-1 ring-shop-ink ring-offset-2 ring-offset-shop-bg"
                        : "hover:ring-1 hover:ring-shop-muted hover:ring-offset-1 hover:ring-offset-shop-bg"
                    }`}
                    style={{ backgroundColor: v.swatchHex || "#1C1A17" }}
                  />
                );
              })}
            </div>
          </div>

          {/* Ilość (dolna linia) + Dodaj do koszyka */}
          <div className="pt-6 border-t border-shop-line flex items-stretch gap-4">
            <div className="inline-flex items-center h-12 border-b border-shop-line px-1 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Zmniejsz ilość"
                className="p-2 text-shop-ink hover:text-shop-bronze transition-colors"
              >
                <Minus className="w-3.5 h-3.5" strokeWidth={1.25} />
              </button>
              <span className="w-10 text-center text-sm font-normal text-shop-ink tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Zwiększ ilość"
                className="p-2 text-shop-ink hover:text-shop-bronze transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.25} />
              </button>
            </div>

            <button
              type="button"
              disabled={activeVariant.availability === "unavailable"}
              onClick={handleAddToCart}
              className={`flex-1 h-12 px-6 rounded-[2px] text-[12px] font-normal uppercase tracking-[0.14em] transition-colors duration-300 ${
                activeVariant.availability === "unavailable"
                  ? "border border-shop-line bg-transparent text-shop-muted cursor-not-allowed"
                  : "border border-shop-ink bg-shop-ink text-shop-bg hover:bg-transparent hover:text-shop-ink"
              }`}
            >
              {activeVariant.availability === "unavailable"
                ? "Niedostępny"
                : "Dodaj do koszyka"}
            </button>
          </div>

          {/* Akordeony: jeden wzorzec (linia, plus/minus) */}
          <div className="pt-4 border-t border-shop-line">
            {product.description && (
              <div className="border-b border-shop-line">
                <button
                  type="button"
                  onClick={() => setOpenDesc((v) => !v)}
                  aria-expanded={openDesc}
                  className="w-full py-5 flex items-center justify-between gap-4 text-left text-shop-ink hover:text-shop-bronze transition-colors"
                >
                  <span className="text-[12px] uppercase tracking-[0.16em]">
                    Opis produktu
                  </span>
                  {openDesc ? (
                    <Minus className="w-4 h-4 text-shop-muted shrink-0" strokeWidth={1.25} />
                  ) : (
                    <Plus className="w-4 h-4 text-shop-muted shrink-0" strokeWidth={1.25} />
                  )}
                </button>
                {openDesc && (
                  <div className="pb-6 text-sm font-light text-shop-muted leading-relaxed max-w-[60ch]">
                    {product.description}
                  </div>
                )}
              </div>
            )}

            <TechnicalDocsAccordion files={activeVariant.files} />

            <div className="border-b border-shop-line">
              <button
                type="button"
                onClick={() => setOpenDelivery((v) => !v)}
                aria-expanded={openDelivery}
                className="w-full py-5 flex items-center justify-between gap-4 text-left text-shop-ink hover:text-shop-bronze transition-colors"
              >
                <span className="text-[12px] uppercase tracking-[0.16em]">
                  Dostawa i zwroty
                </span>
                {openDelivery ? (
                  <Minus className="w-4 h-4 text-shop-muted shrink-0" strokeWidth={1.25} />
                ) : (
                  <Plus className="w-4 h-4 text-shop-muted shrink-0" strokeWidth={1.25} />
                )}
              </button>
              {openDelivery && (
                <div className="pb-6 space-y-4 text-sm font-light text-shop-muted leading-relaxed">
                  {freeShippingThreshold > 0 && (
                    <p className="text-shop-ink">
                      Darmowa dostawa dla zamówień od {formatGrosze(freeShippingThreshold)}.
                    </p>
                  )}

                  {enabledMethods.length > 0 && (
                    <ul className="divide-y divide-shop-line border-t border-b border-shop-line">
                      {enabledMethods.map((m) => (
                        <li
                          key={m.method}
                          className="py-2.5 flex items-center justify-between gap-4"
                        >
                          <span className="text-shop-ink">{m.label}</span>
                          <span className="tabular-nums text-shop-ink">
                            {formatGrosze(m.priceGrossGrosze)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p>
                    Szczegółowe zasady zwrotów i reklamacji opisane są w{" "}
                    <Link
                      to="/regulamin"
                      className="text-shop-ink underline underline-offset-4 decoration-shop-line hover:decoration-shop-ink transition-colors"
                    >
                      regulaminie sklepu
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Podobne produkty */}
      {similarProducts.length > 0 && (
        <div className="mt-20 md:mt-28 pt-20 md:pt-28 border-t border-shop-line">
          

<ProductCarousel title="Podobne produkty" products={similarProducts} />
        </div>
      )}

      {lightboxIdx !== null && images.length > 0 && (
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