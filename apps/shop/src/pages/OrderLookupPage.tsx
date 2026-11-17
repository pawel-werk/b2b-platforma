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

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-8 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-normal text-shop-text">Sprawdź status zamówienia</h1>
        <p className="text-sm text-shop-muted">
          Podaj numer zamówienia (np. VIL/2026/0001) oraz adres e-mail użyty podczas zakupu.
        </p>
      </div>

      {paymentOutcome && (
        <div
          className={`p-4 rounded-card text-sm font-medium ${
            paymentOutcome === "success"
              ? "bg-status-availBg text-status-availText"
              : "bg-status-orderBg text-status-orderText"
          }`}
        >
          {paymentOutcome === "success"
            ? "Płatność została pomyślnie zaksięgowana. Dziękujemy za zamówienie!"
            : "Płatność nie została ukończona lub została anulowana."}
        </div>
      )}

      <form
        onSubmit={handleLookup}
        className="bg-shop-surface p-6 rounded-card border border-shop-border grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <input
          required
          placeholder="Numer zamówienia"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className="border border-shop-border rounded-lg p-3 text-sm bg-white"
        />
        <input
          required
          type="email"
          placeholder="Adres e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-shop-border rounded-lg p-3 text-sm bg-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-pill bg-shop-accent hover:bg-shop-navy text-white font-bold text-sm py-3 px-6 transition"
        >
          {loading ? "Szukam..." : "Sprawdź status"}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-card bg-status-unavailBg text-status-unavailText text-sm font-medium">
          {error}
        </div>
      )}

      {orderView && (
        <section className="bg-white border border-shop-border rounded-card p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-shop-border pb-4">
            <div>
              <p className="text-xs text-shop-muted uppercase font-bold">Zamówienie</p>
              <h2 className="text-xl font-bold text-shop-navy">{orderView.orderNumber}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-pill bg-shop-surface text-shop-text text-xs font-bold">
                Status: {orderView.status}
              </span>
              <span
                className={`px-3 py-1 rounded-pill text-xs font-bold ${
                  orderView.paymentStatus === "paid"
                    ? "bg-status-availBg text-status-availText"
                    : "bg-status-orderBg text-status-orderText"
                }`}
              >
                Płatność: {orderView.paymentStatus === "paid" ? "Opłacone" : "Nieopłacone"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {orderView.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm border-b border-shop-border/60 pb-2"
              >
                <div>
                  <p className="font-bold text-shop-text">
                    {item.name} ({item.colorName})
                  </p>
                  <p className="text-xs text-shop-muted">
                    SKU: {item.symbol} • Ilość: {item.quantity} szt.
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-shop-text">{formatGrosze(item.lineBruttoGrosze)}</p>
                  <p className="text-[11px] text-shop-muted">
                    ({formatGrosze(item.unitNettoGrosze * item.quantity)} netto)
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-right space-y-1 pt-2">
            <p className="text-xs text-shop-muted">
              Dostawa: {formatGrosze(orderView.totals.shippingBruttoGrosze)}
            </p>
            <p className="text-lg font-bold text-shop-navy">
              Razem brutto: {formatGrosze(orderView.totals.totalBruttoGrosze)}{" "}
              <span className="text-xs font-normal text-shop-muted">
                ({formatGrosze(orderView.totals.itemsNettoGrosze)} netto)
              </span>
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
