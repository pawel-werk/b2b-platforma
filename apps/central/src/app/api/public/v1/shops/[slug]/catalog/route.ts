import { NextResponse } from "next/server";
import { buildCorsHeaders, handleOptionsRequest } from "@/lib/public-api/cors";
import { getBrandVersionOnly, getShopCatalog } from "@/lib/public-api/service";

export async function OPTIONS(req: Request) {
  return handleOptionsRequest(req);
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const version = await getBrandVersionOnly(params.slug);
  if (version === null) {
    const errHeaders = await buildCorsHeaders(req);
    return NextResponse.json({ error: "Nie znaleziono sklepu o podanym skrócie." }, { status: 404, headers: errHeaders });
  }

  const etag = `"v3-${params.slug.toLowerCase()}-v${version}"`;
  const headers = await buildCorsHeaders(req, {
    ETag: etag,
    "Cache-Control": "public, max-age=0, must-revalidate",
  });

  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch.trim() === etag) {
    return new NextResponse(null, { status: 304, headers });
  }

  const catalog = await getShopCatalog(params.slug);
  if (!catalog) {
    return NextResponse.json({ error: "Nie znaleziono katalogu marki." }, { status: 404, headers });
  }

  return NextResponse.json(catalog, { status: 200, headers });
}
