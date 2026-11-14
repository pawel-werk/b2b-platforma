"use client";
import { useCart } from "@/lib/store";
import { useEffect, useState } from "react";
import { createOrder } from "./actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { items, removeItem, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const totalGross = items.reduce((acc, item) => acc + (item.priceGross * item.quantity), 0);
  const totalGrossPLN = (totalGross / 100).toFixed(2);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await createOrder(email, items, totalGross);
    
    if (res.error) {
      toast.error("Błąd", { description: res.error });
    } else {
      toast.success("Zamówienie złożone!", { description: "Dziękujemy za zakupy." });
      clearCart();
    }
    
    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-slate-900">
        <h1 className="text-2xl font-bold mb-4">Twój koszyk jest pusty</h1>
        <a href="/shop" className="text-blue-600 hover:underline">Wróć do katalogu produktów</a>
      </div>
    );
  }

  return (
    // Zabezpieczenie kontenerów klasą text-slate-900
    <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-900">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-bold mb-6">Twój Koszyk</h1>
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full text-left text-sm text-slate-900">
            <thead className="bg-slate-50 border-b text-slate-600">
              <tr>
                <th className="p-4">Produkt</th>
                <th className="p-4 text-center">Ilość</th>
                <th className="p-4 text-right">Suma brutto</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4 text-center">{item.quantity} szt.</td>
                  <td className="p-4 text-right font-medium">{((item.priceGross * item.quantity) / 100).toFixed(2)} zł</td>
                  <td className="p-4 text-right">
                    <button onClick={() => removeItem(item.id)} className="text-red-600 hover:underline text-xs">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
          <h2 className="text-lg font-bold mb-4">Podsumowanie</h2>
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <span className="text-slate-600">Do zapłaty (brutto):</span>
            <span className="text-2xl font-bold">{totalGrossPLN} zł</span>
          </div>

          <form onSubmit={handleCheckout} className="flex flex-col gap-4">
            <label className="flex flex-col text-sm font-medium">
              Adres e-mail kupującego:
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="border p-2 mt-1 rounded bg-white text-slate-900"
                placeholder="kontakt@twojafirma.pl" 
              />
            </label>
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? "Przetwarzanie..." : "Złóż zamówienie"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}