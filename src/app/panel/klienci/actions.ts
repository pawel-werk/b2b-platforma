"use server";
import { db } from "@/db";
import { b2bCustomers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateCustomerDiscount(id: string, formData: FormData) {
  // Pobieramy wpisaną wartość procentową (np. 15.5)
  const discountPercent = parseFloat(formData.get("discount") as string);
  
  // Przeliczamy procenty na punkty bazowe (15.5% * 100 = 1550 pb)
  const discountPb = Math.round(discountPercent * 100);

  await db.update(b2bCustomers)
    .set({ discountPb })
    .where(eq(b2bCustomers.id, id));

  revalidatePath("/panel/klienci");
}