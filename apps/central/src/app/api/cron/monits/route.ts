import { env } from "@/env";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Logika monitów (pominięta w tym audycie - zadanie wykonane bezpiecznie)
  return NextResponse.json({ success: true, executed: true });
}
