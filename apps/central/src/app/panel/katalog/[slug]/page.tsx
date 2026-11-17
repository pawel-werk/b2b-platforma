import { db } from "@/db";
import { brands, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductToggle } from "@/components/catalog/ProductToggle";

export default async function BrandCatalogPage({ params, searchParams }: { params: { slug: string }, searchParams: { q?: string } }) {
  const brandResult = await db.select().from(brands).where(eq(brands.id, params.slug));
  if (!brandResult.length) return notFound();
  const brand = brandResult[0];

  const query = searchParams?.q || "";
  const rawProducts = await db.select().from(products).where(eq(products.brandId, brand.id));
  
  const filteredProducts = rawProducts.filter(p => {
    if (!query) return true;
    const q = query.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.symbol.toLowerCase().includes(q) || p.ean.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 mt-10 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/panel/katalog" className="text-brand-muted hover:text-brand-ink transition text-sm font-semibold">← Powrót do marek</Link>
          </div>
          <h1 className="text-3xl font-bold text-brand-ink">{brand.name} - Asortyment</h1>
        </div>
        <Link 
          href={`/panel/katalog/${brand.id}/new`} 
          className="bg-brand-primary text-white px-6 py-3 rounded-pill font-bold hover:bg-opacity-90 transition"
        >
          + Dodaj produkt
        </Link>
      </div>

      <div className="bg-brand-bg rounded-card border border-brand-border overflow-hidden">
        <div className="p-4 border-b border-brand-border bg-brand-surface">
          <form className="flex max-w-md">
            <input 
              name="q" 
              defaultValue={query} 
              placeholder="Szukaj po nazwie, symbolu lub EAN..." 
              className="w-full px-4 py-2 rounded-pill border border-brand-border outline-none focus:border-brand-primary"
            />
            <button type="submit" className="hidden">Szukaj</button>
          </form>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-brand-surface text-brand-muted border-b border-brand-border">
              <tr>
                <th className="p-4 font-semibold">Produkt</th>
                <th className="p-4 font-semibold">Symbol (SKU)</th>
                <th className="p-4 font-semibold">EAN</th>
                <th className="p-4 font-semibold text-right">Detal netto</th>
                <th className="p-4 font-semibold text-center">Net/Net</th>
                <th className="p-4 font-semibold text-center">Dostępność</th>
                <th className="p-4 font-semibold text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-brand-muted">Brak produktów do wyświetlenia.</td></tr>
              ) : (
                filteredProducts.map(p => {
                  const isNetNet = p.netNetPrice !== null ? "TAK" : "NIE";
                  
                  return (
                    <tr key={p.id} className="border-b border-brand-border hover:bg-brand-surface transition group">
                      <td className="p-4 font-bold text-brand-ink truncate max-w-[250px]">{p.name}</td>
                      <td className="p-4 font-mono text-xs">{p.symbol}</td>
                      <td className="p-4 text-brand-muted text-xs">{p.ean || "Brak danych"}</td>
                      <td className="p-4 text-right font-semibold">
                        {(p.retailPriceNet / 100).toFixed(2)} PLN
                        <div className="text-[10px] text-brand-muted font-normal">+ {p.vatRate}% VAT</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${isNetNet === 'TAK' ? 'bg-amber-100 text-amber-800' : 'text-brand-muted'}`}>
                          {isNetNet}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <ProductToggle id={p.id} productName={p.name} initialStock={p.isAvailable ? 100 : 0} />
                      </td>
                      <td className="p-4 text-right space-x-3">
                        <form action={async () => { "use server"; await import("@/actions/catalog").then(m => m.duplicateProduct(p.id)); }} className="inline">
                          <button className="text-brand-muted hover:text-brand-ink font-semibold">Duplikuj</button>
                        </form>
                        <Link href={`/panel/katalog/${brand.id}/${p.id}`} className="text-brand-primary font-bold hover:underline">
                          Edytuj
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
