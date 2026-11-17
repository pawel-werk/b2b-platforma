import { db } from "@/db";
import { products, brands, companies, companyBrandDiscounts, companyProductPrices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/catalog/ProductForm";
import Link from "next/link";

export default async function ProductEditPage({ params }: { params: { slug: string, id: string } }) {
  const brandRes = await db.select().from(brands).where(eq(brands.id, params.slug));
  if (!brandRes.length) return notFound();
  const brand = brandRes[0];

  let mappedProduct: any = null;
  let customPrices: any[] = [];
  
  if (params.id !== "new") {
    const prodRes = await db.select().from(products).where(eq(products.id, params.id));
    if (!prodRes.length) return notFound();
    
    // Formularz przyjmuje strukturę z UI (sku, isNetNet, stock) - mapujemy ze schematu
    mappedProduct = {
      ...prodRes[0],
      sku: prodRes[0].symbol,
      isNetNet: prodRes[0].netNetPrice !== null,
      stock: prodRes[0].isAvailable ? 100 : 0
    };
    customPrices = await db.select().from(companyProductPrices).where(eq(companyProductPrices.productId, prodRes[0].id));
  }

  const activeCompanies = await db.select().from(companies).where(eq(companies.status, "active"));
  const discounts = await db.select().from(companyBrandDiscounts).where(eq(companyBrandDiscounts.brandId, brand.id));

  const b2bData = activeCompanies.map(c => {
    const d = discounts.find(x => x.companyId === c.id);
    const cp = customPrices.find(x => x.companyId === c.id);
    return {
      id: c.id,
      name: c.name,
      discountPb: d ? d.discountPb : 0,
      customPriceNet: cp ? cp.priceNet : null
    };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 mt-10 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/panel/katalog/${brand.id}`} className="text-brand-muted hover:text-brand-ink transition text-sm font-semibold">← Wróć do {brand.name}</Link>
          </div>
          <h1 className="text-3xl font-bold text-brand-ink">{mappedProduct ? `Edytuj: ${mappedProduct.name}` : "Nowy produkt"}</h1>
        </div>
        <button className="bg-brand-surface border border-brand-border text-brand-ink px-6 py-3 rounded-pill font-bold hover:bg-brand-soft transition">
          Podgląd w sklepie
        </button>
      </div>
      <ProductForm brand={brand} initialData={mappedProduct} b2bData={b2bData} />
    </div>
  );
}
