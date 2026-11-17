import { env } from "@/env";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(req: Request, { params }: { params: { filename: string } }) {
  if (env.STORAGE_DRIVER !== "local") return new NextResponse("Not Found", { status: 404 });
  try {
    const uploadDir = env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
    const buffer = await fs.readFile(path.join(uploadDir, params.filename));
    return new NextResponse(buffer, {
      headers: { "Cache-Control": "public, max-age=31536000", "Content-Type": "application/octet-stream" },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
