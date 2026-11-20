import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trash2, Minus, Plus } from "lucide-react";
import type { ShippingMethodCode } from "@repo/shared";
import { useShop } from "../context/ShopContext";
import { useCartStore } from "../store/cartStore";
import { apiSubmitCheckout, getCentralBaseUrl, resolveAssetUrl } from "../lib/api";
import { formatGrosze } from "../lib/format";
import { ProductCarousel } from "../components/ProductCarousel";

export function CartCheckoutPage() {
  const { shop, catalog } = useShop();
  const items = useCartStore((s) => s.getItems(shop.slug));
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const enabledMethods = shop.deliverySettings.methods.filter((m) => m.enabled);
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethodCode>(
    enabledMethods[0]?.method || "courier"
  );
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [lockerCode, setLockerCode] = useState("");
  const [wantInvoice, setWantInvoice] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [nip, setNip] = useState("");
  const [notes, setNotes] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Twój koszyk | ${shop.name}`;
  }, [shop.name]);

  const itemsBruttoGrosze = items.reduce((s, i) => s + i.bruttoGrosze * i.quantity, 0);
  const itemsNettoGrosze = items.reduce((s, i) => s + i.nettoGrosze * i.quantity, 0);
  const vatGrosze = itemsBruttoGrosze - itemsNettoGrosze;

  const threshold = shop.deliverySettings.freeShippingThresholdGrossGrosze;
  const missingForFreeShipping = Math.max(0, threshold - itemsBruttoGrosze);
  const freeShippingProgress =
    threshold > 0 ? Math.min(100, Math.round((itemsBruttoGrosze / threshold) * 100)) : 100;

  const methodObj =
    enabledMethods.find((m) => m.method === selectedMethod) || enabledMethods[0];
  const shippingBruttoGrosze =
    threshold > 0 && itemsBruttoGrosze >= threshold ? 0 : methodObj?.priceGrossGrosze ?? 0;
  const totalBruttoGrosze = itemsBruttoGrosze + shippingBruttoGrosze;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await apiSubmitCheckout(shop.slug, {
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        customer: { firstName, lastName, email, phone },
        delivery: {
          method: selectedMethod,
          address: selectedMethod === "courier" ? { street, postalCode, city } : undefined,
          lockerCode: selectedMethod === "locker" ? lockerCode : undefined,
        },
        invoice: wantInvoice ? { companyName, nip } : null,
        termsAccepted: termsAccepted as true,
        notes: notes || undefined,
        expectedTotalGrosze: totalBruttoGrosze,
        returnUrl: `${window.location.origin}/zamowienia`,
      });

      clearCart(shop.slug);
      const targetPayUrl = res.paymentUrl.startsWith("http")
        ? res.paymentUrl
        : `${getCentralBaseUrl()}${res.paymentUrl}`;
      window.location.href = targetPayUrl;
    } catch (err: unknown) {
      const eObj = err as { status?: number; data?: Record<string, unknown>; message?: string };
      if (eObj.status === 409 && eObj.data) {
        setErrorMsg(String(eObj.data.message || "Dostępność lub ceny w koszyku uległy zmianie."));
      } else {
        setErrorMsg(eObj.message || "Nie udało się złożyć zamówienia. Sprawdź poprawność pól.");
      }
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="max-w-[1520px] mx-auto px-6 md:px-10 py-24 md:py-32 text-center space-y-5">
        <h1 className="font-display font-normal text-[clamp(36px,4vw,56px)] tracking-[-0.01em] leading-[1.05] text-shop-ink">
          Twój koszyk jest pusty
        </h1>
        <p className="text-sm font-light text-shop-muted">
          Dodaj wybrane produkty z katalogu marki {shop.name}.
        </p>
        <div className="pt-2">
          <Link
            to="/sklep"
            className="inline-flex h-12 items-center justify-center px-8 rounded-[2px] border border-shop-ink bg-shop-ink text-shop-bg text-[12px] font-normal uppercase tracking-[0.14em] transition-colors duration-300 hover:bg-transparent hover:text-shop-ink"
          >
            Przejdź do sklepu
          </Link>
        </div>
      </main>
    );
  }

  const editorialInputClass =
    "w-full bg-transparent border-0 border-b border-shop-line focus:border-shop-bronze focus:outline-none rounded-none py-2 text-sm font-light text-shop-ink placeholder:text-shop-muted/70 transition-colors";

  return (
    <main className="max-w-[1520px] mx-auto px-6 md:px-10 pt-8 md:pt-12 pb-20 md:pb-28">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
        {/* Lewa kolumna: pasek darmowej dostawy + pozycje rozdzielone liniami */}
        <div className="lg:col-span-8 space-y-10">
          <div className="space-y-6">
            <h1 className="font-display font-normal text-[clamp(36px,4vw,56px)] tracking-[-0.01em] leading-[1.05] text-shop-ink">
              Twój koszyk <span className="text-shop-muted">({totalQty})</span>
            </h1>

            {threshold > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs font-light text-shop-muted">
                  {missingForFreeShipping > 0 ? (
                    <>
                      Do darmowej dostawy brakuje:{" "}
                      <span className="font-normal text-shop-ink tabular-nums">
                        {formatGrosze(missingForFreeShipping)}
                      </span>
                    </>
                  ) : (
                    <span className="text-status-avail font-normal">
                      Twoje zamówienie kwalifikuje się do darmowej wysyłki.
                    </span>
                  )}
                </p>
                <div className="h-px w-full bg-shop-line overflow-hidden" aria-hidden="true">
                  <div
                    className="h-full bg-shop-bronze transition-[width] duration-500 ease-out motion-reduce:transition-none"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="divide-y divide-shop-line border-t border-b border-shop-line">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="py-8 flex flex-col sm:flex-row gap-6 sm:gap-8"
              >
                <Link
                  to={`/produkt/${item.productSlug}?kolor=${item.colorCode}`}
                  className="w-24 sm:w-28 aspect-[4/5] bg-shop-surface rounded-none p-3 flex items-center justify-center shrink-0"
                >
                  <img
                    src={resolveAssetUrl(item.imageUrl)}
                    alt={item.productName}
                    width={112}
                    height={140}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </Link>

                <div className="flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        to={`/produkt/${item.productSlug}?kolor=${item.colorCode}`}
                        className="font-display text-[22px] font-normal tracking-[-0.01em] leading-[1.1] text-shop-ink hover:text-shop-bronze transition-colors"
                      >
                        {item.productName}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(shop.slug, item.variantId)}
                        aria-label="Usuń pozycję z koszyka"
                        className="p-1.5 -mr-1.5 text-shop-muted hover:text-shop-ink transition-colors"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.25} />
                      </button>
                    </div>

                    <p className="label">
                      {item.category}
                      {item.collection ? ` · ${item.collection}` : ""}
                    </p>
                    <p className="text-xs font-light text-shop-muted tabular-nums">
                      Kod produktu: {item.symbol}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-xs font-light text-shop-ink">
                      <span className="text-shop-muted">Kolor:</span>
                      <span
                        className="w-3 h-3 rounded-full inline-block border border-shop-ink/15"
                        style={{ backgroundColor: item.swatchHex }}
                      />
                      <span>
                        {item.colorName} ({item.colorCode})
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="inline-flex items-center border-b border-shop-line py-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(shop.slug, item.variantId, item.quantity - 1)
                        }
                        aria-label="Zmniejsz ilość"
                        className="p-1.5 text-shop-ink hover:text-shop-bronze transition-colors"
                      >
                        <Minus className="w-3 h-3" strokeWidth={1.25} />
                      </button>
                      <span className="w-9 text-center text-xs font-normal text-shop-ink tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(shop.slug, item.variantId, item.quantity + 1)
                        }
                        aria-label="Zwiększ ilość"
                        className="p-1.5 text-shop-ink hover:text-shop-bronze transition-colors"
                      >
                        <Plus className="w-3 h-3" strokeWidth={1.25} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-normal text-shop-ink tabular-nums">
                        {formatGrosze(item.bruttoGrosze * item.quantity)}
                      </p>
                      <p className="text-[11px] font-light text-shop-muted tabular-nums">
                        {formatGrosze(item.nettoGrosze * item.quantity)} netto
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prawa kolumna: sticky, tło surface, bez obramowania */}
        <aside className="lg:col-span-4 lg:sticky lg:top-28 bg-shop-surface p-8 md:p-10 space-y-8 rounded-none">
          <h2 className="font-display text-[28px] font-normal tracking-[-0.01em] leading-[1.05] text-shop-ink">
            Podsumowanie
          </h2>

          <div className="space-y-3.5 text-sm border-b border-shop-line pb-6">
            <div className="flex justify-between items-start gap-4">
              <span className="font-light text-shop-muted">
                Suma częściowa ({totalQty})
              </span>
              <div className="text-right">
                <p className="font-normal text-shop-ink tabular-nums">
                  {formatGrosze(itemsBruttoGrosze)}
                </p>
                <p className="text-[11px] font-light text-shop-muted tabular-nums">
                  {formatGrosze(itemsNettoGrosze)} netto
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center gap-4">
              <span className="font-light text-shop-muted">Dostawa</span>
              <span className="font-normal text-shop-ink tabular-nums">
                {formatGrosze(shippingBruttoGrosze)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-baseline gap-4">
            <span className="label text-shop-ink">Suma</span>
            <div className="text-right">
              <p className="font-display text-[32px] font-normal tracking-[-0.01em] leading-none text-shop-ink tabular-nums">
                {formatGrosze(totalBruttoGrosze)}
              </p>
              <p className="text-[11px] font-light text-shop-muted tabular-nums mt-1.5">
                zawiera {formatGrosze(vatGrosze)} VAT
              </p>
            </div>
          </div>

          {!showCheckoutForm ? (
            <button
              type="button"
              onClick={() => setShowCheckoutForm(true)}
              className="w-full h-12 rounded-[2px] border border-shop-ink bg-shop-ink text-shop-bg text-[12px] font-normal uppercase tracking-[0.14em] transition-colors duration-300 hover:bg-transparent hover:text-shop-ink"
            >
              Przejdź do kasy
            </button>
          ) : (
            <form onSubmit={handleCheckout} className="space-y-6 pt-6 border-t border-shop-line">
              <h3 className="label text-shop-ink">Dane odbiorcy i dostawa</h3>

              {/* Metody dostawy jako wiersze z radiem i linią */}
              <div className="space-y-2">
                <p className="label">Metoda dostawy</p>
                <div className="divide-y divide-shop-line border-t border-b border-shop-line">
                  {enabledMethods.map((m) => (
                    <label
                      key={m.method}
                      className="flex items-center justify-between gap-3 py-3 text-xs cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5 font-light text-shop-ink">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          checked={selectedMethod === m.method}
                          onChange={() => setSelectedMethod(m.method)}
                          className="accent-shop-ink"
                        />
                        {m.label}
                      </span>
                      <span className="font-normal text-shop-ink tabular-nums">
                        {formatGrosze(m.priceGrossGrosze)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <label className="block space-y-1">
                  <span className="label block">Imię</span>
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={editorialInputClass}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="label block">Nazwisko</span>
                  <input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={editorialInputClass}
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="label block">Adres e-mail</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={editorialInputClass}
                />
              </label>

              <label className="block space-y-1">
                <span className="label block">Telefon kontaktowy</span>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={editorialInputClass}
                />
              </label>

              {selectedMethod === "courier" && (
                <div className="space-y-5">
                  <label className="block space-y-1">
                    <span className="label block">Ulica i numer</span>
                    <input
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className={editorialInputClass}
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <label className="block space-y-1">
                      <span className="label block">Kod pocztowy</span>
                      <input
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className={editorialInputClass}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="label block">Miejscowość</span>
                      <input
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={editorialInputClass}
                      />
                    </label>
                  </div>
                </div>
              )}

              {selectedMethod === "locker" && (
                <label className="block space-y-1">
                  <span className="label block">Kod paczkomatu</span>
                  <input
                    required
                    placeholder="np. WRO01M"
                    value={lockerCode}
                    onChange={(e) => setLockerCode(e.target.value)}
                    className={editorialInputClass}
                  />
                </label>
              )}

              <label className="flex items-center gap-2.5 text-xs font-light text-shop-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantInvoice}
                  onChange={(e) => setWantInvoice(e.target.checked)}
                  className="accent-shop-ink"
                />
                <span>Chcę otrzymać fakturę VAT na firmę</span>
              </label>

              {wantInvoice && (
                <div className="space-y-5">
                  <label className="block space-y-1">
                    <span className="label block">Nazwa firmy</span>
                    <input
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className={editorialInputClass}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="label block">NIP (10 cyfr)</span>
                    <input
                      required
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      className={editorialInputClass}
                    />
                  </label>
                </div>
              )}

              <label className="block space-y-1">
                <span className="label block">Uwagi do zamówienia (opcjonalnie)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={`${editorialInputClass} resize-none`}
                />
              </label>

              <label className="flex items-start gap-2.5 text-xs font-light text-shop-muted cursor-pointer leading-relaxed">
                <input
                  required
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 accent-shop-ink"
                />
                <span>
                  Akceptuję{" "}
                  <Link
                    to="/regulamin"
                    className="text-shop-ink underline underline-offset-4 decoration-shop-line"
                  >
                    regulamin sklepu
                  </Link>{" "}
                  oraz{" "}
                  <Link
                    to="/polityka-prywatnosci"
                    className="text-shop-ink underline underline-offset-4 decoration-shop-line"
                  >
                    politykę prywatności
                  </Link>{" "}
                  (wymagane).
                </span>
              </label>

              {errorMsg && (
                <p className="border-l-2 border-status-unavail pl-3.5 py-1 text-xs font-normal text-status-unavail leading-relaxed">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-[2px] border border-shop-ink bg-shop-ink text-shop-bg text-[12px] font-normal uppercase tracking-[0.14em] transition-colors duration-300 hover:bg-transparent hover:text-shop-ink disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Składanie zamówienia..." : "Zamawiam i płacę"}
              </button>
            </form>
          )}
        </aside>
      </div>

      {catalog.products.length > 0 && (
        <div className="mt-20 md:mt-28 pt-20 md:pt-28 border-t border-shop-line">
          

<ProductCarousel
            title="Inne osoby również kupiły te produkty"
            products={catalog.products.slice(0, 6)}
          />
        </div>
      )}
    </main>
  );
}