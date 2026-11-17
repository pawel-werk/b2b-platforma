import { NextResponse } from "next/server";
import { buildCorsHeaders, handleOptionsRequest } from "@/lib/public-api/cors";
import { resolveShop } from "@/lib/public-api/service";

export async function OPTIONS(req: Request) {
  return handleOptionsRequest(req);
}

export async function GET(req: Request) {
  const headers = await buildCorsHeaders(req);
  const { searchParams } = new URL(req.url);
  const host = searchParams.get("host");
  const slug = searchParams.get("slug");

  if (!host && !slug) {
    return NextResponse.json(
      { error: "Wymagany jest parametr ?host= lub ?slug=" },
      { status: 400, headers }
    );
  }

  const data = await resolveShop({ host, slug });
  if (!data) {
    return NextResponse.json(
      { error: "Nie znaleziono sklepu dla podanej domeny lub skrótu marki." },
      { status: 404, headers }
    );
  }

  return NextResponse.json(data, { status: 200, headers });
}
