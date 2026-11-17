"use server";
import { db } from "@/db";
import { orderNotes, notifications, companyChangeRequests } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function addCustomerOrderNote(orderId: string, content: string) {
  const session = await auth();
  if (!session || session.user.role !== "company") throw new Error("Brak autoryzacji");

  await db.insert(orderNotes).values({
    orderId,
    author: "customer",
    content: content.trim(),
    isVisibleToCustomer: true
  });

  await db.insert(notifications).values({
    type: "customer_note",
    title: "Nowa wiadomość od klienta",
    content: `Klient dodał notatkę do zamówienia.`,
    relatedId: orderId
  });

  revalidatePath(`/b2b/zamowienia/${orderId}`);
}

export async function requestCompanyDataChange(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "company") throw new Error("Brak autoryzacji");
  
  const companyId = session.user.companyId!;
  
  const proposedData = {
    street: formData.get("street"),
    zipCode: formData.get("zipCode"),
    city: formData.get("city"),
    contactPhone: formData.get("contactPhone")
  };

  await db.insert(companyChangeRequests).values({
    companyId,
    proposedData,
    status: "pending"
  });

  await db.insert(notifications).values({
    type: "data_change",
    title: "Wniosek o zmianę danych",
    content: `Firma prosi o zmianę swoich danych rejestrowych/kontaktowych.`,
    relatedId: companyId
  });

  revalidatePath("/b2b/dane");
}
