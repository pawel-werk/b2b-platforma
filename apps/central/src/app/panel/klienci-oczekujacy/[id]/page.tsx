import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { rejectCompany } from "@/actions/customers";

export default async function PendingDetailsPage({ params }: { params: { id: string } }) {
  const comp = await db.select().from(companies).where(eq(companies.id, params.id));
  if (!comp.length) return notFound();
  const company = comp[0];

  return (
    <div className="max-w-3xl mx-auto bg-brand-bg rounded-card shadow-sm border border-brand-border p-8 mt-10">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-ink">{company.name}</h1>
          <p className="text-brand-muted mt-1">NIP: {company.nip}</p>
        </div>
        <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-pill text-xs">Oczekujący</span>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
        <div className="bg-brand-surface p-4 rounded-card">
          <p className="text-brand-muted mb-1 font-semibold">Dane rejestrowe</p>
          <p>{company.street}</p>
          <p>{company.zipCode} {company.city}</p>
        </div>
        <div className="bg-brand-surface p-4 rounded-card">
          <p className="text-brand-muted mb-1 font-semibold">Kontakt</p>
          <p>{company.contactEmail}</p>
          <p>{company.contactPhone}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-6 border-t border-brand-border">
        <Link 
          href={`/panel/klienci-oczekujacy/${company.id}/kondycje`}
          className="bg-brand-primary text-white font-bold px-6 py-3 rounded-pill hover:bg-opacity-90 transition text-center flex-1"
        >
          Ustaw kondycje i Akceptuj
        </Link>
        
        <form action={rejectCompany} className="flex-1 flex gap-2">
          <input type="hidden" name="id" value={company.id} />
          <input type="text" name="reason" required placeholder="Powód odrzucenia" className="flex-1 border border-brand-border bg-brand-surface px-4 py-3 rounded-pill text-sm focus:bg-brand-bg" />
          <button type="submit" className="bg-red-500 text-white font-bold px-6 py-3 rounded-pill hover:bg-red-600 transition">
            Odrzuć
          </button>
        </form>
      </div>
    </div>
  );
}
