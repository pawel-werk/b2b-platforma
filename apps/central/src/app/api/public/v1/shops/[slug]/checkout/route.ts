import { NextResponse } from "next/server";
import { CheckoutRequestSchema } from "@repo/shared";
import { buildCorsHeaders, handleOptionsRequest } from "@/lib/public-api/cors";
import { checkDatabaseRateLimit, extractClientIp } from "@/lib/public-api/rate-limit";
import { processB2CCheckout } from "@/lib/public-api/service";

export async function OPTIONS(req: Request) {
  return handleOptionsRequest(req);
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const headers = await buildCorsHeaders(req);
  const ip = extractClientIp(req);
  const rate = await checkDatabaseRateLimit(`checkout:${params.slug}`, ip, 10, 60);

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Przekroczono limit zapytań (maksymalnie 10 prób na minutę). Spróbuj ponownie za chwilę." },
      { status: 429, headers }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy format JSON w ciele żądania." }, { status: 400, headers });
  }

  const parsed = CheckoutRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Błąd walidacji danych formularza zamówienia.",
        issues: parsed.error.flatten(),
      },
      { status: 400, headers }
    );
  }

  const result = await processB2CCheckout(params.slug, parsed.data);
  return NextResponse.json(result.body, { status: result.status, headers });
}
