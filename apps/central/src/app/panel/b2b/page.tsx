import { db } from "@/db";
import { companies } from "@/db/schema";
import { or, eq, desc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function B2BCustomersPage({ searchParams }: { searchParams: { q?: string, status?: string } }) {
  const query = searchParams?.q?.toLowerCase() || "";
  const statusFilter = searchParams?.status || "all";

  // Pobieramy wszystkich aktywnych i zablokowanych, filtrujemy prosto w JS dla bezpieczeństwa
  const allB2b = await db.select().from(companies)
    .where(or(eq(companies.status, "active"), eq(companies.status, "blocked")))
    .orderBy(desc(companies.createdAt));

  const filtered = allB2b.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (query && !c.name.toLowerCase().includes(query) && !c.nip.includes(query)) return false;
    return true;
  });

  return (
    <div className="bg-brand-bg rounded-card shadow-sm border border-brand-border p-6">
      <h1 className="text-2xl font-bold mb-6 text-brand-ink">Klienci B2B</h1>
      
      <form className="flex gap-4 mb-6">
        <input name="q" defaultValue={query} placeholder="Szukaj po nazwie lub NIP..." className="flex-1 border border-brand-border p-3 rounded-pill bg-brand-surface outline-none" />
        <select name="status" defaultValue={statusFilter} className="border border-brand-border p-3 rounded-pill bg-brand-surface outline-none">
          <option value="all">Wszystkie statusy</option>
          <option value="active">Tylko aktywni</option>
          <option value="blocked">Tylko zablokowani</option>
        </select>
        <button type="submit" className="bg-brand-ink text-white px-6 rounded-pill font-bold">Filtruj</button>
      </form>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-brand-muted bg-brand-surface rounded-card">Brak wyników.</div>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-surface text-brand-muted border-b border-brand-border">
            <tr>
              <th className="p-4 font-semibold">Firma</th>
              <th className="p-4 font-semibold">NIP</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((company) => (
              <tr key={company.id} className="border-b border-brand-border hover:bg-brand-surface">
                <td className="p-4 font-bold">{company.name}</td>
                <td className="p-4">{company.nip}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-pill text-xs font-bold ${company.status === 'active' ? 'bg-brand-soft text-brand-primary' : 'bg-red-100 text-red-700'}`}>
                    {company.status === 'active' ? 'Aktywny' : 'Zablokowany'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Link href={`/panel/b2b/${company.id}`} className="text-brand-primary font-bold hover:underline">
                    Zarządzaj →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
