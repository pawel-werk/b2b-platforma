import { NextResponse } from "next/server";
import { db } from "@/db";
import { brands, deliveryMethods, settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function OPTIONS() { return new NextResponse(null, { status: 200 }); }

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const bRes = await db.select().from(brands).where(eq(brands.slug, params.slug));
  if (!bRes.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const brand = bRes[0];

  const deliveries = await db.select().from(deliveryMethods).where(eq(deliveryMethods.brandId, brand.id));
  const sRes = await db.select().from(settings);

  return NextResponse.json({
    brand: { name: brand.name, theme: brand.theme },
    sellerData: sRes.length ? sRes[0].sellerData : null,
    deliveryMethods: deliveries.filter(d => d.isActive)
  });
}
