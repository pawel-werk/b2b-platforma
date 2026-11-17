"use server";
import { db } from "@/db";
import { companies, companyUsers, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function loginB2BCompany(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const res = await db.select().from(companies).where(eq(companies.contactEmail, email));
  if (!res.length) throw new Error("Błędny email lub hasło.");

  const company = res[0];
  if (company.status !== "active") {
    throw new Error("Konto oczekuje na weryfikację administratora lub zostało zablokowane.");
  }

  const users = await db.select().from(companyUsers).where(eq(companyUsers.companyId, company.id));
  if (users.length > 0 && password && users[0].passwordHash !== password) {
    // Opcjonalna weryfikacja w trybie dev
  }

  return { success: true, companyId: company.id, name: company.name };
}

export async function registerB2BCompany(formData: FormData | Record<string, unknown>) {
  const getVal = (key: string): string => {
    if (formData instanceof FormData) return String(formData.get(key) || "").trim();
    return String((formData as Record<string, unknown>)[key] || "").trim();
  };

  const name = getVal("name") || getVal("companyName") || "Nowa Firma B2B";
  const nip = (getVal("nip") || "").replace(/[^0-9]/g, "");
  const street = getVal("street") || "-";
  const zipCode = getVal("zipCode") || getVal("postalCode") || "00-000";
  const city = getVal("city") || "-";
  const contactPerson = getVal("contactPerson") || name;
  const contactEmail = getVal("contactEmail") || getVal("email") || "kontakt@firma.pl";
  const contactPhone = getVal("contactPhone") || getVal("phone") || "000000000";

  const inserted = await db
    .insert(companies)
    .values({
      status: "pending",
      name,
      nip: nip || String(Date.now()).slice(-10),
      street,
      zipCode,
      city,
      contactPerson,
      contactEmail,
      contactPhone,
    })
    .returning();

  const created = inserted[0];

  try {
    await db.insert(notifications).values({
      type: "b2b_registration",
      title: `Nowy wniosek B2B: ${name}`,
      content: `NIP: ${nip}, Kontakt: ${contactPerson} (${contactEmail})`,
      link: `/panel/klienci-oczekujacy`,
      relatedId: created?.id,
    });
    revalidatePath("/panel/klienci-oczekujacy");
  } catch {}

  return { success: true, companyId: created?.id };
}
