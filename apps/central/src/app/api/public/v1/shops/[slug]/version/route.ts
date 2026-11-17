import { NextResponse } from "next/server";
import { buildCorsHeaders, handleOptionsRequest } from "@/lib/public-api/cors";
import { getBrandVersionOnly } from "@/lib/public-api/service";

export async function OPTIONS(req: Request) {
  return handleOptionsRequest(req);
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const headers = await buildCorsHeaders(req, { "Cache-Control": "no-store" });
  const contentVersion = await getBrandVersionOnly(params.slug);

  if (contentVersion === null) {
    return NextResponse.json({ error: "Nie znaleziono marki." }, { status: 404, headers });
  }

  return NextResponse.json({ contentVersion }, { status: 200, headers });
}
