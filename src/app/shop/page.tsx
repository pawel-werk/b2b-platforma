import { getTenantBrand, getB2bCustomer } from "@/lib/tenant";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProductCard from "./ProductCard";

// WYMUSZENIE WIDOKU DYNAMICZNEGO:
export const instant = false;

export default async function ShopPage() {
  const brand = await getTenantBrand();
  const b2bCustomer = await getB2bCustomer();

  if (!brand) notFound();

  const brandProducts = await db.query.products.findMany({
    where: and(eq(products.brandId, brand.id), eq(products.isDeleted, false)),
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-8 text-slate-900">
        {b2bCustomer ? "Oferta Hurtowa (Ceny Netto po rabatach)" : "Nowości w ofercie"}
      </h2>
      
      {brandProducts.length === 0 ? (
        <div className="bg-slate-50 p-8 rounded-lg text-center border border-dashed">
          <p className="text-slate-500">Brak produktów w ofercie tej marki.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {brandProducts.map(product => (
            <ProductCard key={product.id} product={product} b2bCustomer={b2bCustomer} />
          ))}
        </div>
      )}
    </div>
  );
}