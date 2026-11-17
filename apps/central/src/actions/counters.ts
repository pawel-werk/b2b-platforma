"use server";
import { db } from "@/db";
import { companies, orders, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const getAdminCounters = unstable_cache(
  async () => {
    try {
      const pendingRes = await db.select({ id: companies.id }).from(companies).where(eq(companies.status, "pending"));
      const ordersRes = await db.select({ id: orders.id }).from(orders).where(eq(orders.fulfillmentStatus, "new"));
      const inboxRes = await db.select({ id: notifications.id }).from(notifications).where(eq(notifications.isRead, false));

      return {
        pendingClients: pendingRes.length,
        newOrders: ordersRes.length,
        unreadMessages: inboxRes.length,
      };
    } catch {
      return { pendingClients: 0, newOrders: 0, unreadMessages: 0 };
    }
  },
  ["admin-counters"],
  { tags: ["admin-counters"], revalidate: 60 }
);
