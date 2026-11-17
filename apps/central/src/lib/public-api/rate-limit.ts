import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ensureB2CSchemaAndSeed } from "./b2c-db";

export async function checkDatabaseRateLimit(
  scope: string,
  ip: string,
  limit = 10,
  windowSeconds = 60
): Promise<{ allowed: boolean; remaining: number }> {
  await ensureB2CSchemaAndSeed();
  const bucketKey = `${scope}:${ip || "127.0.0.1"}`;

  const res = await db.execute(sql`
    INSERT INTO rate_limits (bucket_key, hit_count, window_start)
    VALUES (${bucketKey}, 1, NOW())
    ON CONFLICT (bucket_key) DO UPDATE
    SET
      hit_count = CASE
        WHEN rate_limits.window_start < NOW() - (${windowSeconds} * INTERVAL '1 second') THEN 1
        ELSE rate_limits.hit_count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < NOW() - (${windowSeconds} * INTERVAL '1 second') THEN NOW()
        ELSE rate_limits.window_start
      END
    RETURNING hit_count;
  `);

  const rows = (res as unknown as { rows?: Array<{ hit_count: number }> }).rows ?? (res as unknown as Array<{ hit_count: number }>);
  const currentHits = Number(rows[0]?.hit_count ?? 1);

  return {
    allowed: currentHits <= limit,
    remaining: Math.max(0, limit - currentHits),
  };
}

export function extractClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "127.0.0.1";
}
