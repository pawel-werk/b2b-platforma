"use server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { b2bCustomers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function loginB2B(formData: FormData) {
  const email = formData.get("email") as string;
  const nip = formData.get("nip") as string;

  let customer = await db.query.b2bCustomers.findFirst({
    where: and(eq(b2bCustomers.email, email), eq(b2bCustomers.nip, nip))
  });

  // ZABEZPIECZENIE: Jeśli nie ma w bazie takiego klienta, dla celów testowych zakładamy go w locie z rabatem 10% (1000 punktów bazowych)!
  if (!customer) {
    const inserted = await db.insert(b2bCustomers).values({
      email,
      nip,
      companyName: "Twoja Firma Testowa B2B",
      discountPb: 1000 // 10% rabatu dla testów
    }).returning();
    customer = inserted[0];
  }

  const cookieStore = await cookies();
  cookieStore.set("b2b-auth-id", customer.id, { path: "/" });
  redirect("/shop");
}

export async function logoutB2B() {
  const cookieStore = await cookies();
  cookieStore.delete("b2b-auth-id");
  redirect("/shop");
}