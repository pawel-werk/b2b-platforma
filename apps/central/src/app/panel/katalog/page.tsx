import { db } from "@/db";
import { brands, products } from "@/db/schema";
import Link from "next/link";

export default async function CatalogPage() {
  const allBrands = await db.select().from(brands);
  const allProducts = await db.select().from(products);

  return (
    <div className="max-w-6xl mx-auto space-y-8 mt-10 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-brand-ink">Katalog produktów</h1>
        <p className="text-brand-muted mt-2">Zarządzaj asortymentem, cenami i dostępnością marek.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allBrands.map(brand => {
          const brandProducts = allProducts.filter(p => p.brandId === brand.id);
          const outOfStock = brandProducts.filter(p => p.isAvailable === false).length;
          
          return (
            <Link key={brand.id} href={`/panel/katalog/${brand.id}`}>
              <div className="bg-brand-bg border border-brand-border p-6 rounded-card hover:border-brand-primary hover:shadow-md transition group h-full flex flex-col justify-between cursor-pointer">
                <div>
                  <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center font-bold text-xl text-white" style={{ backgroundColor: brand.theme ? (brand.theme as any).color : '#000' }}>
                    {brand.name.charAt(0)}
                  </div>
                  <h2 className="text-xl font-bold text-brand-ink group-hover:text-brand-primary transition">{brand.name}</h2>
                </div>
                
                <div className="mt-6 flex justify-between items-center text-sm">
                  <div className="bg-brand-surface px-3 py-1.5 rounded-pill text-brand-ink font-semibold">
                    {brandProducts.length} produktów
                  </div>
                  {outOfStock > 0 && (
                    <div className="text-red-600 font-bold bg-red-50 px-3 py-1.5 rounded-pill">
                      Brak: {outOfStock}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  );
}
