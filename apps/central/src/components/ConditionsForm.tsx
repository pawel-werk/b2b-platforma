"use client";
import { useState } from "react";
import { acceptCompanyAndSetConditions, searchProducts } from "@/actions/customers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = {
  companyId: string;
  brands: any[];
  initialDiscounts?: Record<string, string>;
  initialPaymentTerm?: string;
  initialCreditLimit?: string;
  initialCustomPrices?: any[];
};

export function ConditionsForm({ 
  companyId, 
  brands,
  initialDiscounts = {},
  initialPaymentTerm = "prepayment",
  initialCreditLimit = "",
  initialCustomPrices = []
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [discounts, setDiscounts] = useState<Record<string, string>>(initialDiscounts);
  const [paymentTerm, setPaymentTerm] = useState(initialPaymentTerm);
  const [creditLimit, setCreditLimit] = useState(initialCreditLimit);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [customPrices, setCustomPrices] = useState<any[]>(initialCustomPrices);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length >= 2) {
      const results = await searchProducts(val);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const addProduct = (product: any) => {
    if (!customPrices.find(p => p.id === product.id)) {
      setCustomPrices([...customPrices, { ...product, customPrice: "" }]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedDiscounts: Record<string, number> = {};
      Object.entries(discounts).forEach(([id, val]) => {
        if (val) formattedDiscounts[id] = Math.round(parseFloat(val) * 100);
      });

      const payload = {
        companyId,
        paymentTerm,
        creditLimit: creditLimit ? Math.round(parseFloat(creditLimit) * 100) : null,
        discounts: formattedDiscounts,
        customPrices: customPrices.map(p => ({
          productId: p.id,
          priceNet: Math.round(parseFloat(p.customPrice) * 100)
        }))
      };

      await acceptCompanyAndSetConditions(payload);
      toast.success("Kondycje zapisane pomyślnie!");
      router.refresh();
    } catch (error) {
      toast.error("Błąd podczas zapisywania kondycji.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-brand-surface p-6 rounded-card border border-brand-border">
        <h2 className="font-bold text-lg mb-4 text-brand-ink">Rabaty podstawowe (%)</h2>
        <div className="grid grid-cols-2 gap-4">
          {brands.map(brand => (
            <div key={brand.id} className="flex items-center justify-between">
              <label className="text-sm font-semibold text-brand-ink">{brand.name}</label>
              <input 
                type="number" step="0.01" min="0" max="100" placeholder="np. 15.50"
                className="border border-brand-border p-2 rounded-lg w-28 text-right focus:border-brand-primary outline-none"
                value={discounts[brand.id] || ""}
                onChange={(e) => setDiscounts({ ...discounts, [brand.id]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-brand-surface p-6 rounded-card border border-brand-border grid grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold mb-2 text-brand-ink">Termin płatności</h2>
          <select 
            className="w-full border border-brand-border p-3 rounded-pill outline-none bg-white"
            value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value)}
          >
            <option value="prepayment">Przedpłata</option>
            <option value="7_days">7 dni</option>
            <option value="14_days">14 dni</option>
            <option value="21_days">21 dni</option>
            <option value="30_days">30 dni</option>
            <option value="45_days">45 dni</option>
            <option value="60_days">60 dni</option>
          </select>
        </div>
        <div>
          <h2 className="font-bold mb-2 text-brand-ink">Limit kupiecki (PLN netto)</h2>
          <input 
            type="number" step="0.01" min="0" placeholder="Brak limitu"
            className="w-full border border-brand-border p-3 rounded-pill outline-none bg-white"
            value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-brand-surface p-6 rounded-card border border-brand-border">
        <h2 className="font-bold text-lg mb-2 text-brand-ink">Ceny indywidualne (PLN netto)</h2>
        <div className="relative mb-4">
          <input 
            type="text" placeholder="Szukaj produktu po nazwie lub SKU..."
            className="w-full border border-brand-border p-3 rounded-pill outline-none bg-white"
            value={searchQuery} onChange={handleSearch}
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-brand-border mt-1 rounded-card shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map(res => (
                <div key={res.id} onClick={() => addProduct(res)} className="p-3 hover:bg-brand-surface cursor-pointer text-sm border-b border-brand-border">
                  <span className="font-bold">{res.sku}</span> - {res.name}
                </div>
              ))}
            </div>
          )}
        </div>
        {customPrices.length > 0 && (
          <div className="space-y-2">
            {customPrices.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-brand-border">
                <div className="flex-1 text-sm font-semibold truncate">{p.name}</div>
                <input 
                  type="number" step="0.01" min="0" required placeholder="Cena"
                  className="border border-brand-border p-2 rounded-lg w-28 text-right text-sm outline-none"
                  value={p.customPrice}
                  onChange={(e) => {
                    const newPrices = [...customPrices];
                    newPrices[idx].customPrice = e.target.value;
                    setCustomPrices(newPrices);
                  }}
                />
                <button type="button" onClick={() => setCustomPrices(customPrices.filter(cp => cp.id !== p.id))} className="text-red-500 font-bold px-2">X</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button disabled={loading} type="submit" className="w-full bg-brand-primary text-white font-bold py-4 rounded-pill hover:bg-opacity-90 transition">
        Zapisz zmiany w warunkach
      </button>
    </form>
  );
}
