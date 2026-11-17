import { db } from "@/db";
import { brands, products, companyBrandDiscounts, companyProductPrices } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/auth";
import { calculateB2BPrice } from "@/lib/pricing";
import { CatalogTable } from "@/components/b2b/CatalogTable";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function B2BCatalogPage({ searchParams }: { searchParams: { brand?: string, q?: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "company") redirect("/b2b/logowanie");
  
  const companyId = session.user.companyId!;
  
  const activeBrands = await db.select().from(brands).where(eq(brands.isActive, true)).orderBy(asc(brands.displayOrder));
  if (activeBrands.length === 0) return <div className="p-8 text-center font-bold">Brak aktywnych marek w systemie.</div>;

  const currentBrandId = searchParams.brand || activeBrands[0].id;
  const query = searchParams.q?.toLowerCase() || "";

  // Pobieranie dedykowanych warunków klienta
  const rawProducts = await db.select().from(products).where(eq(products.brandId, currentBrandId));
  const discounts = await db.select().from(companyBrandDiscounts).where(eq(companyBrandDiscounts.companyId, companyId));
  const customPrices = await db.select().from(companyProductPrices).where(eq(companyProductPrices.companyId, companyId));

  const brandDiscount = discounts.find(d => d.brandId === currentBrandId)?.discountPb || 0;

  // Filtrowanie i MAPOWANIE CEN NA SERWERZE (nikt nie oszuka API w przeglądarce)
  const mappedProducts = rawProducts.filter(p => {
    if (p.isHidden) return false;
    if (query) {
      return p.name.toLowerCase().includes(query) || p.symbol.toLowerCase().includes(query) || p.ean.includes(query);
    }
    return true;
  }).map(p => {
    const cp = customPrices.find(c => c.productId === p.id)?.priceNet || null;
    const pricing = calculateB2BPrice({
      retailPriceNet: p.retailPriceNet,
      vatRate: p.vatRate,
      netNetPrice: p.netNetPrice,
      customPriceNet: cp,
      discountPb: brandDiscount
    });
    
    return {
      id: p.id,
      name: p.name,
      symbol: p.symbol,
      ean: p.ean || "",
      isAvailable: p.isAvailable,
      retailGross: pricing.retailGross,
      finalNet: pricing.finalNet,
      finalGross: pricing.finalGross,
      priceSource: pricing.priceSource
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-ink mb-2">Katalog i Zamówienia</h1>
          <p className="text-brand-muted">Przeglądaj asortyment i buduj koszyk zakupowy wg swoich warunków.</p>
        </div>
      </div>

      <div className="bg-brand-surface p-2 rounded-xl border border-brand-border flex gap-2 overflow-x-auto">
        {activeBrands.map(b => (
          <Link 
            key={b.id} 
            href={`?brand=${b.id}`} 
            className={`px-6 py-3 rounded-lg font-bold text-sm transition whitespace-nowrap ${currentBrandId === b.id ? 'bg-white shadow-sm text-brand-ink border border-gray-200' : 'text-brand-muted hover:bg-gray-100'}`}
          >
            {b.name}
          </Link>
        ))}
      </div>

      <div className="bg-white p-4 rounded-card border border-brand-border shadow-sm flex">
        <form className="w-full max-w-lg flex gap-4">
          <input type="hidden" name="brand" value={currentBrandId} />
          <input name="q" defaultValue={query} placeholder="Wpisz nazwę, symbol lub EAN..." className="flex-1 border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary" />
          <button type="submit" className="bg-brand-ink text-white px-8 rounded-lg font-bold hover:bg-opacity-90 transition">Szukaj</button>
        </form>
      </div>

      <CatalogTable products={mappedProducts} />
    </div>
  );
}
