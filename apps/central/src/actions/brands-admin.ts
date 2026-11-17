"use server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ensureB2CSchemaAndSeed } from "@/lib/public-api/b2c-db";
import { isReturnUrlAllowed } from "@/lib/public-api/cors";
import type { DeliverySettings } from "@repo/shared";
import crypto from "crypto";

export async function saveBrandDeliverySettings(brandId: string, settings: DeliverySettings) {
  await ensureB2CSchemaAndSeed();
  await db.execute(sql`
    UPDATE brands
    SET delivery_settings = ${JSON.stringify(settings)}::jsonb,
        content_version = COALESCE(content_version, 1) + 1
    WHERE id = ${brandId}
  `);
  try {
    revalidatePath("/panel/marki");
  } catch {}
  return { success: true };
}

export interface UpsertBannerInput {
  id?: string;
  brandId: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  targetUrl: string;
  sortOrder: number;
  isActive: boolean;
}

export async function saveBrandBanner(input: UpsertBannerInput) {
  await ensureB2CSchemaAndSeed();
  const bannerId = input.id || `bn_${crypto.randomBytes(6).toString("hex")}`;

  await db.execute(sql`
    INSERT INTO banners (id, brand_id, image_url, title, subtitle, button_text, target_url, sort_order, is_active)
    VALUES (
      ${bannerId},
      ${input.brandId},
      ${input.imageUrl},
      ${input.title},
      ${input.subtitle},
      ${input.buttonText},
      ${input.targetUrl},
      ${input.sortOrder},
      ${input.isActive}
    )
    ON CONFLICT (id) DO UPDATE SET
      image_url = EXCLUDED.image_url,
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      button_text = EXCLUDED.button_text,
      target_url = EXCLUDED.target_url,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active
  `);

  await db.execute(sql`
    UPDATE brands SET content_version = COALESCE(content_version, 1) + 1 WHERE id = ${input.brandId}
  `);

  try {
    revalidatePath("/panel/marki");
  } catch {}
  return { success: true, id: bannerId };
}

export async function reorderBrandBanner(bannerId: string, brandId: string, direction: "up" | "down") {
  await ensureB2CSchemaAndSeed();
  const res = await db.execute(sql`
    SELECT id, sort_order FROM banners WHERE brand_id = ${brandId} ORDER BY sort_order ASC, id ASC
  `);
  const rows = (res as unknown as { rows?: Array<{ id: string; sort_order: number }> }).rows ?? (res as unknown as Array<{ id: string; sort_order: number }>);

  const idx = rows.findIndex((r) => r.id === bannerId);
  if (idx === -1) return { success: false };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return { success: false };

  const temp = rows[idx];
  rows[idx] = rows[swapIdx];
  rows[swapIdx] = temp;

  for (let i = 0; i < rows.length; i++) {
    await db.execute(sql`UPDATE banners SET sort_order = ${i + 1} WHERE id = ${rows[i].id}`);
  }

  await db.execute(sql`
    UPDATE brands SET content_version = COALESCE(content_version, 1) + 1 WHERE id = ${brandId}
  `);

  try {
    revalidatePath("/panel/marki");
  } catch {}
  return { success: true };
}

export async function toggleBrandBannerActive(bannerId: string, brandId: string, isActive: boolean) {
  await ensureB2CSchemaAndSeed();
  await db.execute(sql`UPDATE banners SET is_active = ${isActive} WHERE id = ${bannerId}`);
  await db.execute(sql`
    UPDATE brands SET content_version = COALESCE(content_version, 1) + 1 WHERE id = ${brandId}
  `);
  try {
    revalidatePath("/panel/marki");
  } catch {}
  return { success: true };
}

export async function completeSimulatedPayment(
  paymentId: string,
  outcome: "success" | "failed" | "cancelled"
): Promise<{ redirectUrl: string }> {
  await ensureB2CSchemaAndSeed();
  const res = await db.execute(sql`SELECT * FROM payments WHERE id = ${paymentId} LIMIT 1`);
  const rows = (res as unknown as { rows?: Array<Record<string, unknown>> }).rows ?? (res as unknown as Array<Record<string, unknown>>);
  if (!rows.length) {
    throw new Error("Nie znaleziono sesji płatności.");
  }

  const payment = rows[0];
  const orderId = String(payment.order_id);
  const orderToken = String(payment.order_token);

  const paymentStatus = outcome === "success" ? "paid" : outcome === "failed" ? "failed" : "cancelled";
  const orderStatus = outcome === "success" ? "oplacone" : "nowe";

  await db.execute(sql`
    UPDATE payments SET status = ${paymentStatus}, updated_at = NOW() WHERE id = ${paymentId};
  `);

  await db.execute(sql`
    UPDATE b2c_orders SET payment_status = ${paymentStatus}, status = ${orderStatus} WHERE id = ${orderId};
  `);

  const rawReturnUrl = String(payment.return_url || "");
  const allowed = await isReturnUrlAllowed(rawReturnUrl);
  const baseReturnUrl = allowed ? rawReturnUrl : `http://localhost:3001/zamowienie/${orderToken}`;

  const urlObj = new URL(baseReturnUrl);
  urlObj.searchParams.set("paymentStatus", outcome);
  urlObj.searchParams.set("orderToken", orderToken);

  return { redirectUrl: urlObj.toString() };
}
