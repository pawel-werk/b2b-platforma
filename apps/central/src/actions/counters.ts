"use server";
import { db } from "@/db";
import { companies, orders, notifications } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";

export async function getAdminCounters() {
  try {
    const pending = await db.select().from(companies).where(eq(companies.status, "pending"));
    const newOrders = await db.select().from(orders).where(eq(orders.fulfillmentStatus, "new"));
    const unread = await db.select().from(notifications).where(isNull(notifications.readAt));

    return {
      pendingClients: pending.length,
      newOrders: newOrders.length,
      unreadMessages: unread.length,
    };
  } catch {
    return { pendingClients: 0, newOrders: 0, unreadMessages: 0 };
  }
}
