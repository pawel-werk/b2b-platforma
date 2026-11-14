import { cookies } from "next/headers";
import { db } from "@/db";
import { brands, b2bCustomers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getTenantBrand() {
  const cookieStore = await cookies();
  const brandId = cookieStore.get("shop-brand-id")?.value;

  if (brandId) {
    const brand = await db.query.brands.findFirst({ where: eq(brands.id, brandId) });
    if (brand) return brand;
  }
  const defaultBrand = await db.query.brands.findFirst({ where: eq(brands.isDeleted, false) });
  return defaultBrand;
}

// NOWA FUNKCJA DO ROZPOZNAWANIA KLIENTA B2B
export async function getB2bCustomer() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("b2b-auth-id")?.value;
  if (!customerId) return null;

  const customer = await db.query.b2bCustomers.findFirst({
    where: eq(b2bCustomers.id, customerId)
  });
  return customer || null;
}