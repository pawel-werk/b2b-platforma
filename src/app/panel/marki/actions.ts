"use server";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function saveBrand(formData: FormData) {
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  await db.insert(brands).values({
    name,
    theme: JSON.stringify({ color }), // Zapisujemy kolor w formacie JSON
  });
  revalidatePath("/panel/marki");
}