import { NextResponse } from "next/server";
import { buildCorsHeaders, handleOptionsRequest } from "@/lib/public-api/cors";
import { getOrderViewByToken } from "@/lib/public-api/service";

export async function OPTIONS(req: Request) {
  return handleOptionsRequest(req);
}

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const headers = await buildCorsHeaders(req, { "Cache-Control": "no-store" });
  const order = await getOrderViewByToken(params.token);

  if (!order) {
    return NextResponse.json({ error: "Nie znaleziono zamówienia." }, { status: 404, headers });
  }

  return NextResponse.json(order, { status: 200, headers });
}
