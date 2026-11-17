"use server";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { signIn } from "@/auth";

export async function loginB2B(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const res = await db.select().from(companies).where(eq(companies.email, email));
  if (!res.length) throw new Error("Błędny email lub hasło.");
  
  const company = res[0];
  const isValid = await bcrypt.compare(password, company.passwordHash || "");
  if (!isValid) throw new Error("Błędny email lub hasło.");

  if (company.status === "pending") throw new Error("Twoje konto oczekuje na weryfikację przez administratora.");
  if (company.status === "blocked") throw new Error("Twoje konto zostało zablokowane. Skontaktuj się z obsługą.");
  if (company.status === "rejected") throw new Error("Twój wniosek rejestracyjny został odrzucony.");

  await signIn("credentials", { email, password, redirectTo: "/b2b" });
}
