"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function switchBrand(brandId: string) {
  const cookieStore = await cookies();
  cookieStore.set("shop-brand-id", brandId, { path: "/" }); // Zapamiętuje wybraną markę
  redirect("/shop"); // Odświeża sklep
}