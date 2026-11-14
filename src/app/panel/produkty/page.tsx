import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import ClientTable from "./ClientTable";

export default async function ProductsPage() {
  const allProducts = await db.query.products.findMany({
    where: eq(products.isDeleted, false),
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });

  const outOfStockCount = allProducts.filter(p => p.availability !== "in_stock").length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Katalog produktów</h1>
          <p className="text-slate-500 mt-1">Niedostępnych produktów: {outOfStockCount}</p>
        </div>
        <a href="/panel/produkty/nowy" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          + Dodaj produkt
        </a>
      </div>
      <ClientTable initialProducts={allProducts} />
    </div>
  );
}