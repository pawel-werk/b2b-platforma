import { db } from "@/db";
import { companies, brands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ConditionsForm } from "@/components/ConditionsForm";

export default async function ConditionsPage({ params }: { params: { id: string } }) {
  const compResult = await db.select().from(companies).where(eq(companies.id, params.id));
  if (!compResult.length) return notFound();
  const company = compResult[0];

  const allBrands = await db.select().from(brands);

  return (
    <div className="max-w-4xl mx-auto bg-brand-bg rounded-card shadow-sm border border-brand-border p-8 mb-10 mt-10">
      <div className="mb-8 pb-6 border-b border-brand-border">
        <h1 className="text-3xl font-bold text-brand-ink mb-1">Warunki handlowe</h1>
        <p className="text-brand-muted">Ustaw kondycje dla: <span className="font-semibold text-brand-ink">{company.name} (NIP: {company.nip})</span></p>
      </div>
      
      <ConditionsForm companyId={company.id} brands={allBrands} />
    </div>
  );
}
