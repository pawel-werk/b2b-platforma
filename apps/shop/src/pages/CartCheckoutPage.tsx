import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trash2, Truck, Minus, Plus } from "lucide-react";
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

  const methodObj =
    enabledMethods.find((m) => m.method === selectedMethod) || enabledMethods[0];
  const shippingBruttoGrosze =
    threshold > 0 && itemsBruttoGrosze >= threshold ? 0 : methodObj?.priceGrossGrosze ?? 0;
  const totalBruttoGrosze = itemsBruttoGrosze + shippingBruttoGrosze;

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
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-16 text-center space-y-4">
        <h1 className="text-3xl font-normal text-shop-text">Twój koszyk jest pusty</h1>
        <p className="text-sm text-shop-muted">
          Dodaj wybrane produkty z katalogu marki {shop.name}.
        </p>
        <Link
          to="/sklep"
          className="inline-block px-8 py-3.5 rounded-pill bg-shop-accent text-white font-bold text-sm"
        >
          Przejdź do sklepu
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Lewa kolumna: Pasek darmowej dostawy + Pozycje koszyka */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-shop-surface border border-shop-border rounded-card px-4 py-3 flex items-center justify-center gap-2 text-xs md:text-sm font-medium text-shop-text">
            <Truck className="w-4 h-4 text-shop-accent" />
            {missingForFreeShipping > 0 ? (
              <span>
                Aby otrzymać darmową wysyłkę, potrzebujesz:{" "}
                <strong>{formatGrosze(missingForFreeShipping)}</strong>
              </span>
            ) : (
              <span className="text-status-availText font-bold">
                Twoje zamówienie kwalifikuje się do darmowej wysyłki!
              </span>
            )}
          </div>

          <h1 className="text-3xl font-normal text-shop-text">
            Twój koszyk ({items.reduce((s, i) => s + i.quantity, 0)})
          </h1>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="p-5 rounded-card border border-shop-border bg-white flex flex-col sm:flex-row gap-6 relative"
              >
                <Link
                  to={`/produkt/${item.productSlug}?kolor=${item.colorCode}`}
                  className="w-28 h-32 bg-shop-surface rounded-lg p-3 flex items-center justify-center shrink-0"
                >
                  <img
                    src={resolveAssetUrl(item.imageUrl)}
                    alt={item.productName}
                    width={110}
                    height={120}
                    className="w-full h-full object-contain"
                  />
                </Link>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      to={`/produkt/${item.productSlug}?kolor=${item.colorCode}`}
                      className="font-bold text-base text-shop-text hover:text-shop-accent"
                    >
                      {item.productName}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(shop.slug, item.variantId)}
                      aria-label="Usuń pozycję z koszyka"
                      className="p-2 rounded-full bg-shop-surface hover:bg-shop-border text-shop-muted hover:text-shop-text"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-shop-muted">
                    {item.category} {item.collection ? `• ${item.collection}` : ""}
                  </p>
                  <p className="text-xs text-shop-muted">Kod produktu: {item.symbol}</p>

                  <div className="flex items-center gap-2 pt-1 text-xs text-shop-text">
                    <span className="font-bold">Kolor:</span>
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-block border border-black/15"
                      style={{ backgroundColor: item.swatchHex }}
                    />
                    <span>
                      {item.colorName} ({item.colorCode})
                    </span>
                  </div>

                  <div className="pt-3 flex items-center gap-6">
                    <div>
                      <span className="font-bold text-base text-shop-text">
                        {formatGrosze(item.bruttoGrosze * item.quantity)}
                      </span>
                      <span className="text-xs text-shop-muted ml-1.5">
                        ({formatGrosze(item.nettoGrosze * item.quantity)} netto)
                      </span>
                    </div>

                    <div className="inline-flex items-center border border-shop-border rounded-pill px-2.5 py-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(shop.slug, item.variantId, item.quantity - 1)
                        }
                        aria-label="Zmniejsz ilość"
                        className="p-1 text-shop-text"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(shop.slug, item.variantId, item.quantity + 1)
                        }
                        aria-label="Zwiększ ilość"
                        className="p-1 text-shop-text"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prawa kolumna: Podsumowanie i formularz zamówienia */}
        <div className="lg:col-span-4 border border-shop-border rounded-card p-6 bg-white space-y-6">
          <h2 className="text-2xl font-normal text-shop-text">Podsumowanie</h2>

          <div className="space-y-3 text-sm border-b border-shop-border pb-4">
            <div className="flex justify-between">
              <span className="text-shop-muted">
                Suma częściowa ({items.reduce((s, i) => s + i.quantity, 0)})
              </span>
              <div className="text-right">
                <p className="font-semibold text-shop-text">{formatGrosze(itemsBruttoGrosze)}</p>
                <p className="text-[11px] text-shop-muted">
                  ({formatGrosze(itemsNettoGrosze)} netto)
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-shop-muted">Dostawa</span>
              <span className="font-semibold text-shop-text">
                {formatGrosze(shippingBruttoGrosze)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="font-bold text-base text-shop-text">Suma</span>
            <div className="text-right">
              <span className="font-bold text-lg text-shop-text">
                {formatGrosze(totalBruttoGrosze)}
              </span>
              <span className="text-xs text-shop-muted ml-1">
                (zawiera {formatGrosze(vatGrosze)} VAT)
              </span>
            </div>
          </div>

          {!showCheckoutForm ? (
            <button
              type="button"
              onClick={() => setShowCheckoutForm(true)}
              className="w-full py-3.5 px-6 rounded-pill bg-shop-navy hover:bg-shop-accent text-white font-bold text-sm transition"
            >
              Przejdź do kasy
            </button>
          ) : (
            <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-shop-border">
              <h3 className="font-bold text-sm text-shop-text">Dane odbiorcy i dostawa</h3>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-shop-muted">Metoda dostawy</label>
                {enabledMethods.map((m) => (
                  <label
                    key={m.method}
                    className="flex items-center justify-between p-2.5 border border-shop-border rounded-lg text-xs cursor-pointer"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        checked={selectedMethod === m.method}
                        onChange={() => setSelectedMethod(m.method)}
                        className="accent-shop-accent"
                      />
                      {m.label}
                    </span>
                    <span className="font-bold">{formatGrosze(m.priceGrossGrosze)}</span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Imię"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border border-shop-border rounded-lg p-2.5 text-sm"
                />
                <input
                  required
                  placeholder="Nazwisko"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border border-shop-border rounded-lg p-2.5 text-sm"
                />
              </div>

              <input
                required
                type="email"
                placeholder="Adres e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-shop-border rounded-lg p-2.5 text-sm"
              />
              <input
                required
                placeholder="Telefon kontaktowy"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-shop-border rounded-lg p-2.5 text-sm"
              />

              {selectedMethod === "courier" && (
                <div className="space-y-3">
                  <input
                    required
                    placeholder="Ulica i numer"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full border border-shop-border rounded-lg p-2.5 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      placeholder="Kod pocztowy"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="border border-shop-border rounded-lg p-2.5 text-sm"
                    />
                    <input
                      required
                      placeholder="Miejscowość"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="border border-shop-border rounded-lg p-2.5 text-sm"
                    />
                  </div>
                </div>
              )}

              {selectedMethod === "locker" && (
                <input
                  required
                  placeholder="Kod paczkomatu (np. WRO01M)"
                  value={lockerCode}
                  onChange={(e) => setLockerCode(e.target.value)}
                  className="w-full border border-shop-border rounded-lg p-2.5 text-sm"
                />
              )}

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantInvoice}
                  onChange={(e) => setWantInvoice(e.target.checked)}
                  className="accent-shop-accent"
                />
                Chcę otrzymać fakturę VAT na firmę
              </label>

              {wantInvoice && (
                <div className="space-y-3">
                  <input
                    required
                    placeholder="Nazwa firmy"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full border border-shop-border rounded-lg p-2.5 text-sm"
                  />
                  <input
                    required
                    placeholder="NIP (10 cyfr)"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full border border-shop-border rounded-lg p-2.5 text-sm"
                  />
                </div>
              )}

              <textarea
                placeholder="Uwagi do zamówienia (opcjonalnie)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-shop-border rounded-lg p-2.5 text-sm"
              />

              <label className="flex items-start gap-2 text-xs text-shop-muted cursor-pointer">
                <input
                  required
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 accent-shop-accent"
                />
                <span>Akceptuję regulamin sklepu oraz politykę prywatności (wymagane).</span>
              </label>

              {errorMsg && (
                <p className="text-xs font-semibold text-status-unavailText bg-status-unavailBg p-3 rounded-lg">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-pill bg-shop-accent hover:bg-shop-navy text-white font-bold text-sm transition disabled:opacity-50"
              >
                {submitting ? "Składanie zamówienia..." : "Zamawiam i płacę"}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-16">
        

<ProductCarousel
          title="Inne osoby również kupiły te produkty"
          products={catalog.products.slice(0, 6)}
        />
      </div>
    </main>
  );
}
