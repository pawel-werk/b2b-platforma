import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1 AS ok`);
    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        dbDriver: process.env.DB_DRIVER || "neon",
        storageDriver: process.env.STORAGE_DRIVER || "local",
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        message: error instanceof Error ? error.message : "Database check failed",
      },
      { status: 500 }
    );
  }
}
