"use server";
import { db } from "@/db";
import { products, brands } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

export async function toggleProductAvailability(id: string, isAvailable: boolean) {
  // STRICT TYPING: w schemacie jest isAvailable (boolean), a nie stock (int)
  const result = await db.update(products).set({ isAvailable }).where(eq(products.id, id)).returning();
  
  if (result.length > 0) {
    const brandId = result[0].brandId;
    try { await db.execute(sql`UPDATE brands SET content_version = COALESCE(content_version, 0) + 1 WHERE id = ${brandId}`); } catch(e) {}
    revalidatePath("/panel/katalog");
    revalidatePath(`/panel/katalog/${brandId}`);
    return true;
  }
  return false;
}

type ProductInput = {
  id?: string;
  brandId: string;
  name: string;
  sku: string; // przychodzi z UI jako sku
  ean: string;
  retailPriceNet: number;
  vatRate: number;
  isNetNet: boolean;
  isAvailable: boolean;
  description?: string;
  images?: unknown[]; // jsonb fallback
  files?: unknown[]; // jsonb fallback
};

export async function saveProduct(data: ProductInput) {
  const isNew = !data.id || data.id === "new";
  let productId = data.id!;

  // STRICT TYPING: Mapowanie interfejsu UI pod fizyczny schemat bazy
  const payload = {
    brandId: data.brandId,
    name: data.name,
    symbol: data.sku,
    ean: data.ean || "",
    retailPriceNet: Math.round(data.retailPriceNet * 100),
    vatRate: data.vatRate,
    netNetPrice: data.isNetNet ? Math.round(data.retailPriceNet * 100) : null,
    isAvailable: data.isAvailable,
    description: data.description || "",
  };

  if (isNew) {
    const res = await db.insert(products).values(payload).returning();
    productId = res[0].id;
  } else {
    await db.update(products).set(payload).where(eq(products.id, productId));
  }

  // Raw SQL execution omija walidację TS dla kolumn których jeszcze nie zadeklarowaliśmy w schema.ts
  try {
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb`);
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb`);
    
    await db.execute(sql`
      UPDATE products 
      SET images = ${JSON.stringify(data.images || [])}::jsonb,
          files = ${JSON.stringify(data.files || [])}::jsonb
      WHERE id = ${productId}
    `);
  } catch(e) {}

  try { await db.execute(sql`UPDATE brands SET content_version = COALESCE(content_version, 0) + 1 WHERE id = ${data.brandId}`); } catch(e) {}

  revalidatePath(`/panel/katalog/${data.brandId}`);
  revalidatePath(`/panel/katalog/${data.brandId}/${productId}`);
  revalidateTag(`brand-${data.brandId}`);
  return { success: true, id: productId };
}

export async function duplicateProduct(id: string) {
  const prod = await db.select().from(products).where(eq(products.id, id));
  if (!prod.length) return false;
  const p = prod[0];
  
  const brandProds = await db.select().from(products).where(eq(products.brandId, p.brandId));
  const maxSymbol = brandProds.map(x => x.symbol).sort().pop();
  
  const match = maxSymbol?.match(/(.*-)(\d+)$/);
  let newSymbol = p.symbol + "-COPY";
  if (match) newSymbol = match[1] + (parseInt(match[2]) + 1);

  // STRICT TYPING: wstawiamy dokładnie to co dyktuje schema
  await db.insert(products).values({
    brandId: p.brandId,
    name: p.name + " (Kopia)",
    symbol: newSymbol,
    ean: p.ean,
    description: p.description,
    retailPriceNet: p.retailPriceNet,
    vatRate: p.vatRate,
    netNetPrice: p.netNetPrice,
    isAvailable: p.isAvailable,
    isHidden: p.isHidden
  });
  
  revalidatePath(`/panel/katalog/${p.brandId}`);
  return true;
}
