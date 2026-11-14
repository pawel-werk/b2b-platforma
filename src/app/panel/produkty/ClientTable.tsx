"use client";
import { useState } from "react";
import { toast } from "sonner";
import { toggleAvailability, duplicateProduct } from "./actions";

export default function ClientTable({ initialProducts }: { initialProducts: any[] }) {
  const [search, setSearch] = useState("");

  const filtered = initialProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.symbol.toLowerCase().includes(search.toLowerCase()) ||
    (p.ean && p.ean.includes(search))
  );

  const handleToggle = async (id: string, currentState: string, name: string) => {
    const newState = await toggleAvailability(id, currentState);
    toast("Zaktualizowano dostępność", {
      description: `Produkt "${name}" jest teraz ${newState === "in_stock" ? "dostępny" : "niedostępny"}.`,
      action: {
        label: "Cofnij",
        onClick: () => handleToggle(id, newState, name),
      },
    });
  };

  return (
    <div>
      <input 
        type="text" 
        placeholder="Szukaj po symbolu, nazwie lub EAN..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md border p-2 mb-4 rounded"
      />
      
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3">Symbol</th>
              <th className="p-3">Nazwa</th>
              <th className="p-3">Cena Netto</th>
              <th className="p-3">Dostępność</th>
              <th className="p-3">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b hover:bg-slate-50 transition">
                <td className="p-3 font-mono">{p.symbol}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">{(p.retailPriceNet / 100).toFixed(2)} PLN</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${p.availability === 'in_stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {p.availability === 'in_stock' ? 'Dostępny' : 'Brak'}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  <a href={`/panel/produkty/${p.id}`} className="text-blue-600 hover:underline">Edytuj</a>
                  <button onClick={() => duplicateProduct(p.id)} className="text-slate-600 hover:underline">Duplikuj</button>
                  <button onClick={() => handleToggle(p.id, p.availability, p.name)} className="text-orange-600 hover:underline">Przełącz dostępność</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-slate-500">Brak wyników</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}