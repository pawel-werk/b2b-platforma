import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth();
        // Tutaj również rzutowanie dla TS
        if ((session?.user as any)?.role !== "admin") throw new Error("Brak autoryzacji do wgrywania plików");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
          tokenPayload: JSON.stringify({ userId: session?.user?.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Plik wgrany do Vercel Blob:", blob.url);
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
