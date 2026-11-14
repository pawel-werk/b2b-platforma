"use server";
import { db } from "@/db";
import { orders, orderItems, brands } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createOrder(customerEmail: string, items: any[], totalGross: number) {
  if (!items || items.length === 0) return { error: "Koszyk jest pusty" };

  let defaultBrand = await db.query.brands.findFirst({ where: eq(brands.isDeleted, false) });
  if (!defaultBrand) return { error: "Błąd konfiguracji sklepu." };

  // 1. Tworzymy nagłówek zamówienia
  const newOrder = await db.insert(orders).values({
    brandId: defaultBrand.id,
    customerEmail: customerEmail,
    totalGross: totalGross,
    status: "new",
  }).returning();

  const orderId = newOrder[0].id;

  // 2. Tworzymy pozycje zamówienia (zamrażamy cenę brutto produktu na ten moment!)
  for (const item of items) {
    await db.insert(orderItems).values({
      orderId: orderId,
      productId: item.id,
      quantity: item.quantity,
      priceGross: item.priceGross, // kwota w groszach
    });
  }

  return { success: true, orderId };
}