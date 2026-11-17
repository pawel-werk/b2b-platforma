import { NextResponse } from "next/server";
import { db } from "@/db";
import { brands, products } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function OPTIONS() { return new NextResponse(null, { status: 200 }); }

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const bRes = await db.select().from(brands).where(eq(brands.slug, params.slug));
    if (!bRes.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    const prods = await db.select().from(products).where(eq(products.brandId, bRes[0].id));
    const data = prods.filter(p => p.isAvailable && !p.isHidden).map(p => ({
      id: p.id,
      name: p.name,
      symbol: p.symbol,
      ean: p.ean,
      retailPriceNet: p.retailPriceNet,
      vatRate: p.vatRate,
      retailPriceGross: Math.round(p.retailPriceNet * (1 + p.vatRate / 100)),
      images: (p as any).images || [],
      files: (p as any).files || [],
      description: p.description
    }));
    
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
