import { NextResponse } from "next/server";
import { db } from "@/db";
import { brands } from "@/db/schema";

export async function OPTIONS() { return new NextResponse(null, { status: 200 }); }

export async function GET() {
  try {
    const allBrands = await db.select().from(brands);
    
    if (allBrands.length === 0) {
      return NextResponse.json({ error: "Brak jakichkolwiek marek w bazie danych!" }, { status: 404 });
    }

    // Bierzemy pierwszą markę z brzegu do trybu deweloperskiego
    const match = allBrands[0];

    return NextResponse.json({
      id: match.id,
      slug: match.slug,
      name: match.name,
      prefix: match.prefix,
      theme: match.theme
    });
  } catch (e: any) {
     return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
