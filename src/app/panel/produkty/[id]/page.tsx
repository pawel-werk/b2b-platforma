import { db } from "@/db";
import { products, brands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { saveProduct } from "../actions";

export default async function ProductFormPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const isNew = params.id === "nowy";
  let product = null;

  if (!isNew) {
    product = await db.query.products.findFirst({ where: eq(products.id, params.id) });
  }

  const allBrands = await db.query.brands.findMany({ where: eq(brands.isDeleted, false) });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{isNew ? "Nowy produkt" : "Edycja produktu"}</h1>
      
      {/* Dodano encType aby formularz obsługiwał przesyłanie plików */}
      <form action={saveProduct} encType="multipart/form-data" className="flex flex-col gap-4 bg-white p-6 shadow-sm border rounded">
        <input type="hidden" name="id" value={isNew ? "" : product?.id} />
        <input type="hidden" name="existingImageUrl" value={product?.imageUrl || ""} />

        {/* MODUŁ ZDJĘCIA */}
        <div className="border rounded p-4 bg-slate-50 flex gap-6 items-center">
          {product?.imageUrl ? (
            <div className="w-24 h-24 relative rounded border overflow-hidden bg-white shrink-0">
               <img src={product.imageUrl} alt="Produkt" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded border-dashed border-2 flex items-center justify-center text-slate-400 text-xs text-center shrink-0">
              Brak<br/>zdjęcia
            </div>
          )}
          <label className="flex flex-col text-sm font-medium w-full">Zmień / Dodaj zdjęcie (JPG, PNG)
            <input type="file" name="image" accept="image/png, image/jpeg, image/webp" className="mt-2 text-sm" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <label className="flex flex-col text-sm font-medium">Marka
            <select name="brandId" defaultValue={product?.brandId} className="border p-2 mt-1 rounded">
              {allBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium">Dostępność
            <select name="availability" defaultValue={product?.availability || "in_stock"} className="border p-2 mt-1 rounded">
              <option value="in_stock">Dostępny</option>
              <option value="out_of_stock">Brak na stanie</option>
              <option value="planned_delivery">Zaplanowana dostawa</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col text-sm font-medium">Nazwa produktu
            <input name="name" required defaultValue={product?.name} className="border p-2 mt-1 rounded" />
          </label>
          <label className="flex flex-col text-sm font-medium">Symbol (np. MKA-001)
            <input name="symbol" required defaultValue={product?.symbol} className="border p-2 mt-1 rounded" />
          </label>
        </div>

        <label className="flex flex-col text-sm font-medium">Krótki opis
          <textarea name="description" required defaultValue={product?.description} className="border p-2 mt-1 rounded h-24" />
        </label>

        <div className="grid grid-cols-3 gap-4 border-t pt-4 mt-2">
          {/* POLA CENOWE W ZŁOTÓWKACH (PLN) */}
          <label className="flex flex-col text-sm font-medium">Cena detal. Netto (PLN)
            <input name="retailPriceNet" type="number" step="0.01" min="0" required defaultValue={product ? (product.retailPriceNet / 100).toFixed(2) : ""} className="border p-2 mt-1 rounded" />
          </label>
          <label className="flex flex-col text-sm font-medium">Cena Net/Net hurt (PLN)
            <input name="wholesalePriceNet" type="number" step="0.01" min="0" defaultValue={product?.wholesalePriceNet ? (product.wholesalePriceNet / 100).toFixed(2) : ""} className="border p-2 mt-1 rounded" />
          </label>
          <label className="flex flex-col text-sm font-medium">Stawka VAT (%)
            <input name="vatRate" type="number" required defaultValue={product?.vatRate || 23} className="border p-2 mt-1 rounded" />
          </label>
        </div>

        <div className="flex justify-end gap-4 mt-4">
          <a href="/panel/produkty" className="px-4 py-2 border rounded hover:bg-slate-50 transition">Anuluj</a>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
            Zapisz produkt
          </button>
        </div>
      </form>
    </div>
  );
}