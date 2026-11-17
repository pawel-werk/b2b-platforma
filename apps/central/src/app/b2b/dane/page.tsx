import { db } from "@/db";
import { companies, companyChangeRequests, brands, companyBrandDiscounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requestCompanyDataChange } from "@/actions/b2b-client";

export default async function B2BMyDataPage() {
  const session = await auth();
  if (!session || session.user.role !== "company") redirect("/b2b/logowanie");
  const compId = session.user.companyId!;

  const compRes = await db.select().from(companies).where(eq(companies.id, compId));
  const company = compRes[0];

  const activeRequests = await db.select().from(companyChangeRequests).where(eq(companyChangeRequests.companyId, compId));
  const hasPendingRequest = activeRequests.some(r => r.status === "pending");

  const allBrands = await db.select().from(brands);
  const discounts = await db.select().from(companyBrandDiscounts).where(eq(companyBrandDiscounts.companyId, compId));

  const handleUpdate = async (formData: FormData) => {
    "use server";
    await requestCompanyDataChange(formData);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-ink">Moje dane i warunki</h1>

      {hasPendingRequest && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg flex items-center gap-4">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="font-bold text-blue-900">Zmiany oczekują na zatwierdzenie</p>
            <p className="text-sm text-blue-800">Przesłano wniosek o aktualizację danych rejestrowych. Zmiany będą widoczne po weryfikacji przez administratora.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-card border border-brand-border">
          <h2 className="text-xl font-bold text-brand-ink mb-6">Warunki handlowe (Tylko do odczytu)</h2>
          
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-brand-muted mb-1">Domyślny termin płatności</p>
              <p className="font-bold text-lg uppercase">{company.paymentTerm}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-muted mb-1">Przyznany limit kupiecki</p>
              <p className="font-bold text-lg">{company.limitNet ? `${(company.limitNet / 100).toFixed(2)} PLN (Netto)` : "Brak limitu kredytowego"}</p>
            </div>
            
            <div className="pt-4 border-t border-brand-border">
              <p className="text-sm font-semibold text-brand-muted mb-3">Twoje rabaty na marki</p>
              <div className="space-y-2">
                {allBrands.map(b => {
                  const d = discounts.find(x => x.brandId === b.id);
                  const val = d ? (d.discountPb / 100).toFixed(2) : "0.00";
                  return (
                    <div key={b.id} className="flex justify-between items-center text-sm bg-brand-surface p-2 rounded">
                      <span className="font-semibold">{b.name}</span>
                      <span className="font-bold text-brand-primary">Rabat {val}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-card border border-brand-border">
          <h2 className="text-xl font-bold text-brand-ink mb-6">Zaktualizuj dane rejestrowe</h2>
          <form action={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Pełna nazwa firmy (Zablokowane)</label>
              <input disabled value={company.name} className="w-full border border-brand-border p-3 rounded-lg outline-none bg-gray-50 text-gray-500 font-bold" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">NIP (Zablokowane)</label>
              <input disabled value={company.nip} className="w-full border border-brand-border p-3 rounded-lg outline-none bg-gray-50 text-gray-500 font-bold font-mono" />
            </div>
            
            <div className="pt-4 border-t border-brand-border space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Ulica i numer</label>
                <input name="street" required disabled={hasPendingRequest} defaultValue={company.street} className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary disabled:opacity-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Kod pocztowy</label>
                  <input name="zipCode" required disabled={hasPendingRequest} defaultValue={company.zipCode} className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Miejscowość</label>
                  <input name="city" required disabled={hasPendingRequest} defaultValue={company.city} className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary disabled:opacity-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Telefon kontaktowy</label>
                <input name="contactPhone" required disabled={hasPendingRequest} defaultValue={company.contactPhone} className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary disabled:opacity-50" />
              </div>
            </div>
            
            <button disabled={hasPendingRequest} type="submit" className="w-full bg-brand-ink text-white font-bold py-3 rounded-pill hover:bg-opacity-90 disabled:opacity-50 transition mt-4">
              Wyślij wniosek o zmianę
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
