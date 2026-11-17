import { NextResponse } from "next/server";
import { OrderLookupRequestSchema } from "@repo/shared";
import { buildCorsHeaders, handleOptionsRequest } from "@/lib/public-api/cors";
import { checkDatabaseRateLimit, extractClientIp } from "@/lib/public-api/rate-limit";
import { getOrderViewByLookup } from "@/lib/public-api/service";

export async function OPTIONS(req: Request) {
  return handleOptionsRequest(req);
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const headers = await buildCorsHeaders(req, { "Cache-Control": "no-store" });
  const ip = extractClientIp(req);
  const rate = await checkDatabaseRateLimit(`lookup:${params.slug}`, ip, 10, 60);

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Przekroczono limit prób wyszukiwania zamówienia. Odczekaj minutę." },
      { status: 429, headers }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy format zapytania." }, { status: 400, headers });
  }

  const parsed = OrderLookupRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Nie znaleziono zamówienia dla podanych danych." },
      { status: 404, headers }
    );
  }

  const order = await getOrderViewByLookup(params.slug, parsed.data.orderNumber, parsed.data.email);
  if (!order) {
    // Bez zdradzania, czy sam numer zamówienia istnieje w bazie
    return NextResponse.json(
      { error: "Nie znaleziono zamówienia dla podanych danych." },
      { status: 404, headers }
    );
  }

  return NextResponse.json(order, { status: 200, headers });
}
