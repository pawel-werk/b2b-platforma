import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function getAllowedOrigins(): Promise<Set<string>> {
  const allowed = new Set<string>([
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
  ]);

  const envOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const o of envOrigins) {
    allowed.add(o.replace(/\/$/, ""));
  }

  try {
    const res = await db.execute(sql`SELECT domain FROM brands WHERE domain IS NOT NULL AND domain != ''`);
    const rows = (res as unknown as { rows?: Array<{ domain: string }> }).rows ?? (res as unknown as Array<{ domain: string }>);
    for (const r of rows) {
      const clean = r.domain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
      if (clean) {
        allowed.add(`https://${clean}`);
        allowed.add(`http://${clean}`);
      }
    }
  } catch {
    // Fallback
  }

  return allowed;
}

export async function isOriginAllowed(origin: string | null): Promise<boolean> {
  if (!origin) return false;
  const cleanOrigin = origin.trim().replace(/\/$/, "");
  if (
    process.env.NODE_ENV !== "production" &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleanOrigin)
  ) {
    return true;
  }
  const allowed = await getAllowedOrigins();
  return allowed.has(cleanOrigin);
}

export async function isReturnUrlAllowed(returnUrl: string): Promise<boolean> {
  try {
    const parsed = new URL(returnUrl);
    return await isOriginAllowed(parsed.origin);
  } catch {
    return false;
  }
}

export async function buildCorsHeaders(req: Request, extraHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    Vary: "Origin",
    ...extraHeaders,
  };

  if (origin && (await isOriginAllowed(origin))) {
    headers["Access-Control-Allow-Origin"] = origin.trim().replace(/\/$/, "");
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, If-None-Match, Authorization";
    headers["Access-Control-Expose-Headers"] = "ETag, Cache-Control";
    headers["Access-Control-Max-Age"] = "86400";
  }

  return headers;
}

export async function handleOptionsRequest(req: Request): Promise<NextResponse> {
  const origin = req.headers.get("origin");
  if (origin && !(await isOriginAllowed(origin))) {
    return NextResponse.json(
      { error: "Niedozwolone źródło zapytania (CORS)." },
      { status: 403, headers: { Vary: "Origin" } }
    );
  }
  const headers = await buildCorsHeaders(req);
  return new NextResponse(null, { status: 204, headers });
}
