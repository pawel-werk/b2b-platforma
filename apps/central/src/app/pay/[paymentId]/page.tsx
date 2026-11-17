import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ensureB2CSchemaAndSeed } from "@/lib/public-api/b2c-db";
import { PaymentSimulatorClient } from "./PaymentSimulatorClient";
import { notFound } from "next/navigation";

export default async function SimulatedPaymentPage({ params }: { params: { paymentId: string } }) {
  await ensureB2CSchemaAndSeed();
  const res = await db.execute(sql`SELECT * FROM payments WHERE id = ${params.paymentId} LIMIT 1`);
  const rows = (res as unknown as { rows?: Array<Record<string, unknown>> }).rows ?? (res as unknown as Array<Record<string, unknown>>);

  if (!rows.length) {
    notFound();
  }

  const payment = rows[0];
  const amountPln = (Number(payment.amount_brutto_grosze || 0) / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold uppercase tracking-wider mb-4">
          Symulowana Bramka Płatności (FakeProvider)
        </span>
        <h1 className="text-xl font-bold text-neutral-900">Opłacenie zamówienia</h1>
        <p className="text-sm text-neutral-500 mt-1">Numer zamówienia: {String(payment.order_number)}</p>

        <div className="my-6 p-5 rounded-2xl bg-neutral-50 border border-neutral-200">
          <p className="text-xs text-neutral-500 uppercase font-semibold">Kwota do zapłaty brutto</p>
          <p className="text-3xl font-bold text-neutral-900 mt-1">{amountPln} zł</p>
        </div>

        <PaymentSimulatorClient
          paymentId={String(payment.id)}
          orderNumber={String(payment.order_number)}
          amountBruttoGrosze={Number(payment.amount_brutto_grosze)}
        />
      </div>
    </div>
  );
}
