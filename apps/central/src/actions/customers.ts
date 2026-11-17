"use server";
import { db } from "@/db";
import { companies, notifications, companyBrandDiscounts, companyProductPrices, products } from "@/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import { auth } from "@/auth";
import { rejectCompanySchema, conditionsSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

const checkAdmin = async () => {
  const session = await auth();
  // Wcześniej zdefiniowaliśmy to w types/next-auth.d.ts, więc TS wie że role istnieje
  if (session?.user?.role !== "admin") {
    throw new Error("Brak uprawnień");
  }
};

export async function rejectCompany(formData: FormData) {
  await checkAdmin();
  const parsed = rejectCompanySchema.parse({
    id: formData.get("id"),
    reason: formData.get("reason")
  });

  // STRICT TYPING: rejectionReason zamiast samego statusu
  await db.update(companies).set({ status: "rejected", rejectionReason: parsed.reason }).where(eq(companies.id, parsed.id));
  
  // STRICT TYPING: relatedId zamiast companyId
  await db.insert(notifications).values({
    relatedId: parsed.id,
    type: "system",
    title: "Wniosek odrzucony",
    content: `Twój wniosek B2B został odrzucony. Powód: ${parsed.reason}`
  });
  
  revalidatePath("/panel/klienci-oczekujacy");
}

type ConditionInput = {
  companyId: string;
  paymentTerm: string;
  creditLimit: number | null;
  discounts: Record<string, number>;
  customPrices: { productId: string, priceNet: number }[];
};

export async function acceptCompanyAndSetConditions(data: unknown) {
  await checkAdmin();
  const parsed = conditionsSchema.parse(data) as ConditionInput;

  // STRICT TYPING: limitNet i rzutowanie enuma dla paymentTerm (zgodne ze schematem)
  await db.update(companies).set({
    status: "active",
    paymentTerm: parsed.paymentTerm as "prepayment" | "d7" | "d14" | "d21" | "d30" | "d45" | "d60",
    limitNet: parsed.creditLimit ? Math.round(parsed.creditLimit) : null,
    approvedAt: new Date()
  }).where(eq(companies.id, parsed.companyId));

  await db.delete(companyBrandDiscounts).where(eq(companyBrandDiscounts.companyId, parsed.companyId));
  
  const newDiscounts = Object.entries(parsed.discounts)
    .filter(([_, pb]) => pb !== undefined && !isNaN(Number(pb)))
    .map(([brandId, pb]) => ({
      companyId: parsed.companyId,
      brandId,
      discountPb: Math.round(pb as number)
    }));

  if (newDiscounts.length > 0) {
    await db.insert(companyBrandDiscounts).values(newDiscounts);
  }

  if (parsed.customPrices.length > 0) {
    await db.delete(companyProductPrices).where(eq(companyProductPrices.companyId, parsed.companyId));
    
    const newPrices = parsed.customPrices.map(cp => ({
      companyId: parsed.companyId,
      productId: cp.productId,
      priceNet: Math.round(cp.priceNet)
    }));
    await db.insert(companyProductPrices).values(newPrices);
  }

  // STRICT TYPING: relatedId zamiast companyId
  await db.insert(notifications).values({
    relatedId: parsed.companyId,
    type: "system",
    title: "Konto B2B aktywne!",
    content: "Twoje warunki handlowe zostały przypisane. Możesz rozpocząć zakupy."
  });
  
  revalidatePath("/panel/klienci-oczekujacy");
  revalidatePath("/panel/b2b");
  return { success: true };
}

export async function searchProducts(query: string) {
  await checkAdmin();
  if (query.length < 2) return [];
  const results = await db.select({
    id: products.id,
    name: products.name,
    sku: products.symbol, // strict mapping: w bazie symbol, na frontend ślemy jako sku
    retailPriceNet: products.retailPriceNet
  }).from(products)
  .where(or(ilike(products.name, `%${query}%`), ilike(products.symbol, `%${query}%`)))
  .limit(10);
  return results;
}
