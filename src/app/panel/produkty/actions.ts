"use server";
import { db } from "@/db";
import { products, brands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadFile } from "@/lib/storage";

export async function toggleAvailability(id: string, currentState: string) {
  const nextState = currentState === "in_stock" ? "out_of_stock" : "in_stock";
  await db.update(products).set({ availability: nextState as any }).where(eq(products.id, id));
  revalidatePath("/panel/produkty", "page");
  return nextState;
}

export async function duplicateProduct(id: string) {
  const product = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!product) return;
  
  await db.insert(products).values({
    ...product,
    id: undefined,
    symbol: product.symbol + "-COPY-" + Math.floor(Math.random() * 1000),
    name: product.name + " (Kopia)",
    createdAt: undefined,
    updatedAt: undefined,
  });
  revalidatePath("/panel/produkty", "page");
}

export async function saveProduct(formData: FormData) {
  const id = formData.get("id") as string;
  const file = formData.get("image") as File;
  
  let imageUrl = formData.get("existingImageUrl") as string | null;
  
  if (file && file.size > 0) {
    const uploadedPath = await uploadFile(file);
    if (uploadedPath) {
      imageUrl = uploadedPath;
    }
  }

  let brandId = formData.get("brandId") as string;

  if (!brandId) {
    let defaultBrand = await db.query.brands.findFirst();
    if (!defaultBrand) {
      const inserted = await db.insert(brands).values({
        name: "Domyślna Marka",
        theme: '{"color": "#3b82f6"}',
      }).returning();
      defaultBrand = inserted[0];
    }
    brandId = defaultBrand.id;
  }

  const retailPricePLN = parseFloat(formData.get("retailPriceNet") as string);
  const wholesalePricePLN = formData.get("wholesalePriceNet") ? parseFloat(formData.get("wholesalePriceNet") as string) : null;

  const data = {
    brandId: brandId,
    symbol: formData.get("symbol") as string,
    ean: (formData.get("ean") as string) || null,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    retailPriceNet: Math.round(retailPricePLN * 100),
    vatRate: parseInt(formData.get("vatRate") as string, 10),
    wholesalePriceNet: wholesalePricePLN !== null ? Math.round(wholesalePricePLN * 100) : null,
    availability: formData.get("availability") as any,
    imageUrl: imageUrl,
  };

  if (id) {
    await db.update(products).set(data).where(eq(products.id, id));
  } else {
    await db.insert(products).values(data);
  }

  revalidatePath("/panel/produkty", "page");
  redirect("/panel/produkty");
}
