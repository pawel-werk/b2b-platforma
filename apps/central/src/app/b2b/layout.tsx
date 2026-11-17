import { auth } from "@/auth";
import Link from "next/link";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CartBadge } from "@/components/b2b/CartBadge";

export default async function B2BLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || session.user.role !== "company") {
    return <>{children}</>;
  }

  const comp = await db.select().from(companies).where(eq(companies.id, session.user.companyId!));
  const currentStatus = comp.length ? comp[0].status : "rejected";
  const rejectionReason = comp.length ? comp[0].rejectionReason : "";

  if (currentStatus === "pending") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg p-6 text-center">
        <div className="w-full max-w-lg bg-white p-10 rounded-card border border-brand-border shadow-sm">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">⏳</div>
          <h1 className="text-2xl font-bold text-brand-ink mb-4">Twoje konto oczekuje na weryfikację</h1>
          <p className="text-brand-muted">Nasi handlowcy aktualnie weryfikują Twój wniosek i ustalają warunki handlowe. Zostaniesz powiadomiony mailowo o aktywacji konta.</p>
        </div>
      </div>
    );
  }

  if (currentStatus === "rejected") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg p-6 text-center">
        <div className="w-full max-w-lg bg-white p-10 rounded-card border border-red-200 shadow-sm">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">❌</div>
          <h1 className="text-2xl font-bold text-brand-ink mb-4">Wniosek odrzucony</h1>
          <p className="text-brand-muted mb-4">Niestety, Twój wniosek o dostęp do platformy B2B został odrzucony.</p>
          {rejectionReason && <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm italic">Powód: {rejectionReason}</div>}
        </div>
      </div>
    );
  }

  if (currentStatus === "blocked") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg p-6 text-center">
        <div className="w-full max-w-lg bg-white p-10 rounded-card border border-brand-border shadow-sm">
          <div className="w-16 h-16 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🔒</div>
          <h1 className="text-2xl font-bold text-brand-ink mb-4">Konto zablokowane</h1>
          <p className="text-brand-muted">Twoje konto zostało tymczasowo zawieszone. Prosimy o kontakt z opiekunem handlowym w celu wyjaśnienia sytuacji.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink flex flex-col">
      <header className="bg-white border-b border-brand-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="font-bold text-xl text-brand-ink tracking-tight">ITALGROUP <span className="text-brand-primary">B2B</span></span>
            <nav className="hidden md:flex gap-6 text-sm font-semibold">
              <Link href="/b2b" className="text-brand-muted hover:text-brand-ink transition">Katalog produktów</Link>
              <Link href="/b2b/zamowienia" className="text-brand-muted hover:text-brand-ink transition">Moje zamówienia</Link>
              <Link href="/b2b/dane" className="text-brand-muted hover:text-brand-ink transition">Moje dane</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/b2b/koszyk" className="flex items-center gap-2 bg-brand-surface px-4 py-2 rounded-pill hover:bg-brand-soft transition">
              <span className="font-bold text-sm">Koszyk</span>
              <CartBadge />
            </Link>
            <form action={async () => { "use server"; const { signOut } = await import("@/auth"); await signOut({ redirectTo: "/b2b/logowanie" }); }}>
              <button className="text-sm font-semibold text-brand-muted hover:text-brand-ink transition">Wyloguj</button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
