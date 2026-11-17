"use server";
import { db } from "@/db";
import { companies, companyUsers, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { isValidNIP } from "@/lib/validations";

export async function registerB2BCompany(formData: FormData) {
  const name = formData.get("name") as string;
  const nip = formData.get("nip") as string;
  const street = formData.get("street") as string;
  const zipCode = formData.get("zipCode") as string;
  const city = formData.get("city") as string;
  const contactPerson = formData.get("contactPerson") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;

  if (!isValidNIP(nip)) throw new Error("Nieprawidłowy numer NIP.");
  if (password.length < 8) throw new Error("Hasło musi mieć minimum 8 znaków.");

  // Sprawdzamy duplikaty
  const existingNip = await db.select().from(companies).where(eq(companies.nip, nip));
  if (existingNip.length > 0) throw new Error("Firma z tym NIP już istnieje w systemie.");

  const existingEmail = await db.select().from(companyUsers).where(eq(companyUsers.email, email));
  if (existingEmail.length > 0) throw new Error("Ten adres e-mail jest już zajęty.");

  // 1. Zapisujemy firmę jako 'pending'
  const newCompany = await db.insert(companies).values({
    name, nip, street, zipCode, city, contactPerson, contactEmail: email, contactPhone: phone,
    status: "pending",
  }).returning();

  const companyId = newCompany[0].id;

  // 2. Tworzymy użytkownika połączonego z firmą
  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(companyUsers).values({
    companyId,
    email,
    passwordHash
  });

  // 3. Powiadomienie dla administratorów
  await db.insert(notifications).values({
    type: "new_application",
    title: "Nowy wniosek B2B",
    content: `Firma ${name} (${nip}) złożyła wniosek o dostęp do platformy B2B.`,
    relatedId: companyId
  });

  return { success: true };
}
