"use server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

export type AvailabilityState = "available" | "on_order" | "on_demand" | "unavailable";

function toCanonicalAvailability(val: unknown, fallbackBool?: boolean): "available" | "on_order" | "unavailable" {
  if (val === "on_order" || val === "on_demand") return "on_order";
  if (val === "unavailable") return "unavailable";
  if (val === "available") return "available";
  if (fallbackBool === false) return "unavailable";
  return "available";
}

export async function toggleProductAvailability(id: string, stateOrBool: AvailabilityState | boolean | string) {
  const availability =
    typeof stateOrBool === "boolean"
      ? stateOrBool
        ? "available"
        : "unavailable"
      : toCanonicalAvailability(stateOrBool);

  const isAvailable = availability !== "unavailable";

  const result = await db
    .update(products)
    .set({ isAvailable })
    .where(eq(products.id, id))
    .returning();

  try {
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available'`);
    await db.execute(sql`UPDATE products SET availability = ${availability} WHERE id = ${id}`);
  } catch (e) {
    console.error("Błąd zapisu kolumny availability:", e);
  }

  if (result.length > 0) {
    const brandId = result[0].brandId;
    await db.execute(sql`UPDATE brands SET content_version = COALESCE(content_version, 1) + 1 WHERE id = ${brandId}`);
    try {
      revalidatePath("/panel/katalog");
      revalidatePath(`/panel/katalog/${brandId}`);
    } catch {}
    return true;
  }
  return false;
}

type ProductInput = {
  id?: string;
  brandId: string;
  name: string;
  sku: string;
  ean: string;
  retailPriceNet: number;
  vatRate: number;
  isNetNet: boolean;
  isAvailable: boolean;
  availability?: string;
  leadTimeNote?: string;
  description?: string;
  images?: unknown[];
  files?: unknown[];
};

export async function saveProduct(data: ProductInput) {
  const isNew = !data.id || data.id === "new";
  let productId = data.id!;

  const availability = toCanonicalAvailability(data.availability, data.isAvailable);
  const isAvailable = availability !== "unavailable";

  const payload = {
    brandId: data.brandId,
    name: data.name,
    symbol: data.sku,
    ean: data.ean || "",
    retailPriceNet: Math.round(data.retailPriceNet * 100),
    vatRate: data.vatRate,
    netNetPrice: data.isNetNet ? Math.round(data.retailPriceNet * 100) : null,
    isAvailable,
    description: data.description || "",
  };

  if (isNew) {
    const res = await db.insert(products).values(payload).returning();
    productId = res[0].id;
  } else {
    await db.update(products).set(payload).where(eq(products.id, productId));
  }

  const slug = data.sku.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  try {
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb`);
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb`);
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available'`);
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT`);
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS lead_time_note TEXT`);

    await db.execute(sql`
      UPDATE products 
      SET images = ${JSON.stringify(data.images || [])}::jsonb,
          files = ${JSON.stringify(data.files || [])}::jsonb,
          availability = ${availability},
          slug = COALESCE(slug, ${slug}),
          lead_time_note = ${data.leadTimeNote || (availability === "on_order" ? "Wysyłka w ciągu 14 dni roboczych" : null)}
      WHERE id = ${productId}
    `);
  } catch (e) {}

  await db.execute(sql`UPDATE brands SET content_version = COALESCE(content_version, 1) + 1 WHERE id = ${data.brandId}`);

  try {
    revalidatePath(`/panel/katalog/${data.brandId}`);
    revalidatePath(`/panel/katalog/${data.brandId}/${productId}`);
    revalidateTag(`brand-${data.brandId}`);
  } catch {}
  return { success: true, id: productId };
}

export async function duplicateProduct(id: string) {
  const prod = await db.select().from(products).where(eq(products.id, id));
  if (!prod.length) return false;
  const p = prod[0];

  const brandProds = await db.select().from(products).where(eq(products.brandId, p.brandId));
  const maxSymbol = brandProds.map((x) => x.symbol).sort().pop();

  const match = maxSymbol?.match(/(.*-)(\d+)$/);
  let newSymbol = p.symbol + "-COPY";
  if (match) newSymbol = match[1] + (parseInt(match[2]) + 1);

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
    isHidden: p.isHidden,
  });

  await db.execute(sql`UPDATE brands SET content_version = COALESCE(content_version, 1) + 1 WHERE id = ${p.brandId}`);
  try {
    revalidatePath(`/panel/katalog/${p.brandId}`);
  } catch {}
  return true;
}
