"use client";
import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

type ProductRow = {
  id: string; name: string; symbol: string; ean: string; isAvailable: boolean;
  retailGross: number; finalNet: number; finalGross: number; priceSource: string;
};

export function CatalogTable({ products }: { products: ProductRow[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleAdd = (p: ProductRow) => {
    const qty = quantities[p.id] || 1;
    addToCart(p.id, qty);
    toast.success(`Dodano ${qty}x ${p.name} do koszyka.`);
    setQuantities(prev => ({ ...prev, [p.id]: 1 }));
  };

  return (
    <div className="bg-white rounded-card border border-brand-border overflow-x-auto shadow-sm">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-brand-surface text-brand-muted border-b border-brand-border">
          <tr>
            <th className="p-4 font-semibold">Produkt</th>
            <th className="p-4 font-semibold">Symbol / EAN</th>
            <th className="p-4 font-semibold text-right">Detal brutto</th>
            <th className="p-4 font-semibold text-right">Twój zakup netto</th>
            <th className="p-4 font-semibold text-right">Twój zakup brutto</th>
            <th className="p-4 font-semibold text-center w-48">Ilość i Akcja</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr><td colSpan={6} className="p-12 text-center text-brand-muted">Brak produktów w tej marce.</td></tr>
          ) : (
            products.map(p => (
              <tr key={p.id} className={`border-b border-brand-border transition ${!p.isAvailable ? 'opacity-50 bg-gray-50' : 'hover:bg-brand-soft'}`}>
                <td className="p-4">
                  <div className="font-bold text-brand-ink truncate max-w-[250px]">{p.name}</div>
                  {!p.isAvailable && <div className="text-xs text-red-500 font-bold mt-1">Chwilowy brak na magazynie</div>}
                </td>
                <td className="p-4">
                  <div className="font-mono text-xs text-brand-ink">{p.symbol}</div>
                  <div className="text-xs text-brand-muted">{p.ean || "Brak EAN"}</div>
                </td>
                <td className="p-4 text-right text-brand-muted line-through decoration-brand-border">
                  {(p.retailGross / 100).toFixed(2)}
                </td>
                <td className="p-4 text-right">
                  <div className="font-bold text-brand-ink text-base">{(p.finalNet / 100).toFixed(2)} PLN</div>
                  {p.priceSource !== "retail" && (
                    <div className="text-[10px] uppercase font-bold text-brand-primary mt-1">
                      {p.priceSource.replace("_", " ")}
                    </div>
                  )}
                </td>
                <td className="p-4 text-right font-semibold text-brand-muted">
                  {(p.finalGross / 100).toFixed(2)} PLN
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <input 
                      type="number" min="1" disabled={!p.isAvailable}
                      value={quantities[p.id] || 1}
                      onChange={e => setQuantities({ ...quantities, [p.id]: parseInt(e.target.value) || 1 })}
                      className="w-16 border border-brand-border p-2 rounded-lg text-center outline-none disabled:bg-gray-100 font-bold"
                    />
                    <button 
                      disabled={!p.isAvailable}
                      onClick={() => handleAdd(p)}
                      className="bg-brand-ink text-white p-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
                    >
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
