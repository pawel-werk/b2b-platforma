import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default async function PendingCustomersPage() {
  const pending = await db.select().from(companies).where(eq(companies.status, "pending")).orderBy(desc(companies.createdAt));

  return (
    <div className="bg-brand-bg rounded-card shadow-sm border border-brand-border p-6 overflow-hidden">
      <h1 className="text-2xl font-bold mb-6 text-brand-ink">Klienci oczekujący</h1>
      
      {pending.length === 0 ? (
        <div className="text-center py-12 text-brand-muted bg-brand-surface rounded-card">Brak nowych wniosków.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-surface text-brand-muted border-b border-brand-border">
              <tr>
                <th className="p-4 font-semibold rounded-tl-card">Firma</th>
                <th className="p-4 font-semibold">NIP</th>
                <th className="p-4 font-semibold">Kontakt</th>
                <th className="p-4 font-semibold">Data zgłoszenia</th>
                <th className="p-4 font-semibold rounded-tr-card">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((company) => (
                <tr key={company.id} className="border-b border-brand-border hover:bg-brand-surface transition group">
                  <td className="p-4 font-bold text-brand-ink">{company.name}</td>
                  <td className="p-4">{company.nip}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span>{company.contactEmail}</span>
                      <span className="text-brand-muted text-xs">{company.contactPhone}</span>
                    </div>
                  </td>
                  <td className="p-4">{format(new Date(company.createdAt), "d MMMM yyyy, HH:mm", { locale: pl })}</td>
                  <td className="p-4">
                    <Link href={`/panel/klienci-oczekujacy/${company.id}`} className="text-brand-primary font-semibold hover:underline">
                      Rozpatrz →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
