"use server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(orderId: string, newStatus: string) {
  await db.update(orders).set({ status: newStatus }).where(eq(orders.id, orderId));
  
  // Odświeżamy cache, aby zmiany były widoczne od razu po przeładowaniu
  revalidatePath("/panel/zamowienia");
  revalidatePath(`/panel/zamowienia/${orderId}`);
}