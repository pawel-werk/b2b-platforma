import { NextResponse } from "next/server";
import { buildCorsHeaders, handleOptionsRequest } from "@/lib/public-api/cors";
import { getSingleShopProduct } from "@/lib/public-api/service";

export async function OPTIONS(req: Request) {
  return handleOptionsRequest(req);
}

export async function GET(
  req: Request,
  { params }: { params: { slug: string; productSlug: string } }
) {
  const headers = await buildCorsHeaders(req);
  const product = await getSingleShopProduct(params.slug, params.productSlug);

  if (!product) {
    return NextResponse.json(
      { error: "Nie znaleziono produktu w katalogu tej marki." },
      { status: 404, headers }
    );
  }

  return NextResponse.json(product, { status: 200, headers });
}
