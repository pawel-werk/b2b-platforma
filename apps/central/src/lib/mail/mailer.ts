import { Resend } from "resend";
import { db } from "@/db";
import { mailLog } from "@/db/schema";
import { render } from "@react-email/render";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");
const ENABLED = process.env.MAIL_SEND_ENABLED === "true";
const FROM_EMAIL = process.env.MAIL_FROM || "powiadomienia@italgroup.pl";

export async function sendSystemEmail(to: string, subject: string, template: React.ReactElement) {
  const htmlContent = await render(template);
  let status = "simulated";
  let errorMsg = null;

  if (ENABLED) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html: htmlContent,
      });
      status = "sent";
    } catch (e: any) {
      status = "error";
      errorMsg = e.message;
      console.error("Błąd wysyłki Resend:", e);
    }
  }

  // Zapis do tabeli mail_log niezależnie od tego, czy wysłano, czy tylko zasymulowano
  await db.insert(mailLog).values({
    recipient: to,
    subject,
    htmlContent,
    status,
    errorMsg,
  });

  return { success: status !== "error" };
}
