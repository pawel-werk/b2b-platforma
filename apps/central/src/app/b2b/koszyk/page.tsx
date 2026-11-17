"use client";
import { useState, useEffect } from "react";
import { getCart } from "@/lib/cart";
import { fetchCartData, placeB2BOrder } from "@/actions/b2b-cart";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function CartPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [note, setNote] = useState("");

  const loadCart = async () => {
    try {
      const cart = getCart();
      const res = await fetchCartData(cart);
      setData(res);
    } catch (e) {
      toast.error("Błąd ładowania koszyka.");
    }
    setLoading(false);
  };

  useEffect(() => { loadCart(); }, []);

  const handleRemove = (id: string) => {
    const cart = getCart();
    delete cart[id];
    localStorage.setItem('b2b_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart_update'));
    loadCart();
  };

  const handleCheckout = async () => {
    if (data?.limit && data.limit.afterOrder < 0) {
      toast.error("Przekroczono limit kupiecki!");
      return;
    }
    setOrdering(true);
    try {
      const cart = getCart();
      const result = await placeB2BOrder(cart, note);
      
      if (!result.success) {
        toast.error(result.error);
        setOrdering(false);
        return;
      }

      localStorage.removeItem('b2b_cart');
      window.dispatchEvent(new Event('cart_update'));
      toast.success("Zamówienie zostało pomyślnie złożone!");
      window.location.href = "/b2b/zamowienia"; // Przeniesie do Moje Zamówienia
    } catch (e: any) {
      toast.error("Wystąpił nieoczekiwany błąd aplikacji.");
      setOrdering(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-brand-muted font-bold">Ładowanie i wyliczanie rabatów...</div>;
  if (!data || data.items.length === 0) return (
    <div className="bg-white p-12 rounded-card border border-brand-border text-center">
      <h2 className="text-2xl font-bold text-brand-ink mb-2">Twój koszyk jest pusty</h2>
      <p className="text-brand-muted">Przejdź do katalogu, aby dodać produkty.</p>
    </div>
  );

  const limitExceeded = data.limit && data.limit.afterOrder < 0;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-brand-ink">Twój koszyk</h1>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-card border border-brand-border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-surface text-brand-muted border-b border-brand-border">
                <tr>
                  <th className="p-4">Produkt</th>
                  <th className="p-4 text-center">Ilość</th>
                  <th className="p-4 text-right">Cena Netto</th>
                  <th className="p-4 text-right">Wartość Netto</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item: any) => (
                  <tr key={item.product.id} className="border-b border-brand-border">
                    <td className="p-4">
                      <div className="font-bold text-brand-ink">{item.product.name}</div>
                      <div className="text-xs text-brand-muted font-mono mt-1">{item.product.symbol}</div>
                    </td>
                    <td className="p-4 text-center font-bold">{item.qty} szt.</td>
                    <td className="p-4 text-right font-semibold">{(item.pricing.finalNet / 100).toFixed(2)} PLN</td>
                    <td className="p-4 text-right font-bold text-brand-primary">{(item.itemNet / 100).toFixed(2)} PLN</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleRemove(item.product.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white p-6 rounded-card border border-brand-border">
            <h3 className="font-bold text-brand-ink mb-4">Uwagi do zamówienia</h3>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Opcjonalny komentarz..." className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary min-h-[100px]"></textarea>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-card border border-brand-border">
            <h3 className="font-bold text-brand-ink mb-6">Podsumowanie</h3>
            
            <div className="space-y-3 text-sm border-b border-brand-border pb-4 mb-4">
              <div className="flex justify-between">
                <span className="text-brand-muted">Wartość netto</span>
                <span className="font-bold">{(data.summary.net / 100).toFixed(2)} PLN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Podatek VAT</span>
                <span className="font-bold">{(data.summary.vat / 100).toFixed(2)} PLN</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-brand-ink text-lg">Do zapłaty</span>
              <span className="font-bold text-brand-primary text-xl">{(data.summary.gross / 100).toFixed(2)} PLN</span>
            </div>

            <div className="bg-brand-surface p-4 rounded-lg mb-6">
              <p className="text-sm font-semibold mb-1">Forma płatności:</p>
              <p className="text-xs text-brand-muted uppercase font-bold text-amber-700">{data.paymentTerm}</p>
            </div>

            {data.limit && (
              <div className={`p-4 rounded-lg mb-6 border ${limitExceeded ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <h4 className="font-bold text-xs uppercase mb-2">Limit Kupiecki Netto</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>Przyznany:</span> <span>{(data.limit.total / 100).toFixed(2)} PLN</span></div>
                  <div className="flex justify-between"><span>Wykorzystany:</span> <span>{(data.limit.used / 100).toFixed(2)} PLN</span></div>
                  <div className="flex justify-between font-bold border-t pt-1 mt-1">
                    <span>Po tym zamówieniu:</span> 
                    <span className={limitExceeded ? 'text-red-600' : 'text-green-600'}>{(data.limit.afterOrder / 100).toFixed(2)} PLN</span>
                  </div>
                </div>
              </div>
            )}

            <button 
              disabled={ordering || limitExceeded} 
              onClick={handleCheckout} 
              className="w-full bg-brand-primary text-white font-bold py-4 rounded-pill hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {ordering ? "Przetwarzanie..." : limitExceeded ? "Brak środków na limicie" : "Złóż zamówienie"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
