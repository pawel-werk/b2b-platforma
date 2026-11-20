import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import type { OrderStatusView } from "@repo/shared";
import { useShop } from "../context/ShopContext";
import { apiGetOrderByToken, apiLookupOrder } from "../lib/api";
import { formatGrosze } from "../lib/format";

export function OrderLookupPage() {
  const { token } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const { shop } = useShop();

  const queryToken = token || searchParams.get("orderToken") || "";
  const paymentOutcome = searchParams.get("paymentStatus");

  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [orderView, setOrderView] = useState<OrderStatusView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Sprawdź zamówienie | ${shop.name}`;
  }, [shop.name]);

  useEffect(() => {
    if (!queryToken) return;
    setLoading(true);
    apiGetOrderByToken(queryToken)
      .then((data) => {
        setOrderView(data);
        setError(null);
      })
      .catch(() => setError("Nie znaleziono zamówienia dla podanego tokenu."))
      .finally(() => setLoading(false));
  }, [queryToken]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiLookupOrder(shop.slug, orderNumber, email);
      setOrderView(data);
    } catch {
      setOrderView(null);
      setError("Nie znaleziono zamówienia dla podanego numeru i adresu e-mail.");
    } finally {
      setLoading(false);
    }
  };

  const editorialInputClass =
    "w-full bg-transparent border-0 border-b border-shop-line focus:border-shop-bronze focus:outline-none rounded-none py-2.5 text-sm font-light text-shop-ink placeholder:text-shop-muted/70 transition-colors";

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24 space-y-12">
      <header className="space-y-3">
        <p className="label">Obsługa zamówienia</p>
        <h1 className="font-display font-normal text-[clamp(36px,4vw,56px)] tracking-[-0.01em] leading-[1.05] text-shop-ink">
          Sprawdź status zamówienia
        </h1>
        <p className="text-sm font-light text-shop-muted leading-relaxed max-w-[68ch]">
          Podaj numer zamówienia oraz adres e-mail użyty podczas zakupu.
        </p>
      </header>

      {paymentOutcome && (
        <div
          className={`border-l-2 pl-4 py-1 text-sm font-normal leading-relaxed ${
            paymentOutcome === "success"
              ? "border-status-avail text-status-avail"
              : "border-status-order text-status-order"
          }`}
        >
          {paymentOutcome === "success"
            ? "Płatność została pomyślnie zaksięgowana. Dziękujemy za zamówienie."
            : "Płatność nie została ukończona lub została anulowana."}
        </div>
      )}

      <form
        onSubmit={handleLookup}
        className="pt-8 border-t border-shop-line grid grid-cols-1 md:grid-cols-12 gap-6 items-end"
      >
        <label className="md:col-span-4 block space-y-1">
          <span className="label block">Numer zamówienia</span>
          <input
            required
            placeholder="np. VIL/2026/0001"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className={editorialInputClass}
          />
        </label>

        <label className="md:col-span-5 block space-y-1">
          <span className="label block">Adres e-mail</span>
          <input
            required
            type="email"
            placeholder="jan@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={editorialInputClass}
          />
        </label>

        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-[2px] border border-shop-ink bg-shop-ink text-shop-bg text-[12px] font-normal uppercase tracking-[0.14em] transition-colors duration-300 hover:bg-transparent hover:text-shop-ink disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Szukam..." : "Sprawdź"}
          </button>
        </div>
      </form>

      {error && (
        <p className="border-l-2 border-status-unavail pl-4 py-1 text-sm font-normal text-status-unavail">
          {error}
        </p>
      )}

      {orderView && (
        <section className="pt-10 border-t border-shop-line space-y-10">
          <div className="space-y-1.5">
            <p className="label">Zamówienie</p>
            <h2 className="font-display text-[32px] font-normal tracking-[-0.01em] leading-[1.05] text-shop-ink">
              {orderView.orderNumber}
            </h2>
          </div>

          {/* Pionowy timeline statusów */}
          <ol className="relative border-l border-shop-line ml-1.5 pl-6 space-y-6">
            <li className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[29px] top-1.5 w-2 h-2 rounded-full bg-shop-ink"
              />
              <p className="label">Zamówienie przyjęte</p>
              <p className="text-sm font-light text-shop-ink mt-1">
                Numer referencyjny {orderView.orderNumber}
              </p>
            </li>

            <li className="relative">
              <span
                aria-hidden="true"
                className={`absolute -left-[29px] top-1.5 w-2 h-2 rounded-full ${
                  orderView.paymentStatus === "paid"
                    ? "bg-status-avail"
                    : "bg-status-order"
                }`}
              />
              <p className="label">Płatność</p>
              <p
                className={`text-sm font-normal mt-1 ${
                  orderView.paymentStatus === "paid"
                    ? "text-status-avail"
                    : "text-status-order"
                }`}
              >
                {orderView.paymentStatus === "paid" ? "Opłacone" : "Nieopłacone"}
              </p>
            </li>

            <li className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[29px] top-1.5 w-2 h-2 rounded-full bg-shop-bronze"
              />
              <p className="label">Status realizacji</p>
              <p className="text-sm font-normal text-shop-ink mt-1">
                {orderView.status}
              </p>
            </li>
          </ol>

          {/* Pozycje zamówienia */}
          <div className="divide-y divide-shop-line border-t border-b border-shop-line">
            {orderView.items.map((item, i) => (
              <div
                key={i}
                className="py-5 flex items-start justify-between gap-4 text-sm"
              >
                <div className="space-y-1">
                  <p className="font-normal text-shop-ink">
                    {item.name} ({item.colorName})
                  </p>
                  <p className="text-xs font-light text-shop-muted tabular-nums">
                    SKU: {item.symbol} · Ilość: {item.quantity} szt.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-normal text-shop-ink tabular-nums">
                    {formatGrosze(item.lineBruttoGrosze)}
                  </p>
                  <p className="text-[11px] font-light text-shop-muted tabular-nums">
                    {formatGrosze(item.unitNettoGrosze * item.quantity)} netto
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Podsumowanie kwot */}
          <div className="text-right space-y-1.5">
            <p className="text-xs font-light text-shop-muted tabular-nums">
              Dostawa: {formatGrosze(orderView.totals.shippingBruttoGrosze)}
            </p>
            <p className="font-display text-[28px] font-normal tracking-[-0.01em] text-shop-ink tabular-nums">
              {formatGrosze(orderView.totals.totalBruttoGrosze)}
            </p>
            <p className="text-xs font-light text-shop-muted tabular-nums">
              Razem brutto ({formatGrosze(orderView.totals.itemsNettoGrosze)} netto)
            </p>
          </div>
        </section>
      )}
    </main>
  );
}