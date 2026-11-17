"use server";
import { db } from "@/db";
import { orders, orderNotes, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addOrderNote(orderId: string, content: string, isVisibleToCustomer: boolean) {
  await db.insert(orderNotes).values({
    orderId,
    author: "staff",
    content,
    isVisibleToCustomer
  });
  revalidatePath(`/panel/zamowienia/${orderId}`);
}

export async function updateOrderStatus(orderId: string, status: any) {
  await db.update(orders).set({ fulfillmentStatus: status }).where(eq(orders.id, orderId));
  
  // Automatyczna notatka systemowa i powiadomienie (Kryterium Akceptacji)
  await db.insert(orderNotes).values({
    orderId,
    author: "system",
    content: `Status zamówienia zmieniony na: ${status}`,
    isVisibleToCustomer: true
  });
  
  await db.insert(notifications).values({
    type: "order_update",
    title: "Aktualizacja zamówienia",
    content: `Twoje zamówienie zmieniło status na: ${status}`,
    relatedId: orderId
  });

  revalidatePath(`/panel/zamowienia`);
  revalidatePath(`/panel/zamowienia/${orderId}`);
}
