import { NextResponse } from "next/server";
import { buildCorsHeaders, handleOptionsRequest } from "@/lib/public-api/cors";
import { resolveShop } from "@/lib/public-api/service";

export async function OPTIONS(req: Request) {
  return handleOptionsRequest(req);
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const headers = await buildCorsHeaders(req);
  const shop = await resolveShop({ slug: params.slug });

  if (!shop) {
    return NextResponse.json({ error: "Nie znaleziono marki." }, { status: 404, headers });
  }

  return NextResponse.json(shop.deliverySettings, { status: 200, headers });
}
