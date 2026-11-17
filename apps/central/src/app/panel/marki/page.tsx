import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ensureB2CSchemaAndSeed, DEFAULT_DELIVERY_SETTINGS } from "@/lib/public-api/b2c-db";
import { BrandsManagerClient } from "./BrandsManagerClient";
import type { DeliverySettings } from "@repo/shared";

export default async function MarkiPage() {
  await ensureB2CSchemaAndSeed();

  const brandsRes = await db.execute(sql`
    SELECT id, slug, name, content_version, delivery_settings
    FROM brands
    ORDER BY name ASC
  `);
  const brandRows = (brandsRes as unknown as { rows?: Array<Record<string, unknown>> }).rows ?? (brandsRes as unknown as Array<Record<string, unknown>>);

  const bannersRes = await db.execute(sql`
    SELECT id, brand_id, image_url, title, subtitle, button_text, target_url, sort_order, is_active
    FROM banners
    ORDER BY sort_order ASC, id ASC
  `);
  const bannerRows = (bannersRes as unknown as { rows?: Array<Record<string, unknown>> }).rows ?? (bannersRes as unknown as Array<Record<string, unknown>>);

  const mapped = brandRows.map((b) => {
    const bId = String(b.id);
    return {
      id: bId,
      slug: String(b.slug),
      name: String(b.name),
      contentVersion: Number(b.content_version ?? 1),
      deliverySettings: (b.delivery_settings as DeliverySettings | null) ?? DEFAULT_DELIVERY_SETTINGS,
      banners: bannerRows
        .filter((bn) => String(bn.brand_id) === bId)
        .map((bn) => ({
          id: String(bn.id),
          imageUrl: String(bn.image_url),
          title: String(bn.title),
          subtitle: String(bn.subtitle || ""),
          buttonText: String(bn.button_text || "Zobacz kolekcję"),
          targetUrl: String(bn.target_url || "/katalog"),
          sortOrder: Number(bn.sort_order ?? 1),
          isActive: Boolean(bn.is_active),
        })),
    };
  });

  return <BrandsManagerClient initialBrands={mapped} />;
}
