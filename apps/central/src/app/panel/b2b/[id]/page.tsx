import { db } from "@/db";
import { companies, brands, companyBrandDiscounts, companyProductPrices, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ConditionsForm } from "@/components/ConditionsForm";
import { revalidatePath } from "next/cache";

export default async function B2BClientDetailsPage({ params }: { params: { id: string } }) {
  // Zabezpieczenie przed błędnym UUID w adresie URL
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(params.id)) return notFound();

  const comp = await db.select().from(companies).where(eq(companies.id, params.id));
  if (!comp.length) return notFound();
  const company = comp[0];

  const allBrands = await db.select().from(brands);
  const rawDiscounts = await db.select().from(companyBrandDiscounts).where(eq(companyBrandDiscounts.companyId, company.id));
  
  const initialDiscounts: Record<string, string> = {};
  rawDiscounts.forEach(d => { 
    initialDiscounts[d.brandId] = (d.discountPb / 100).toFixed(2); 
  });

  const rawPricesData = await db.select().from(companyProductPrices).where(eq(companyProductPrices.companyId, company.id));
  const allProducts = await db.select().from(products);

  const initialCustomPrices = rawPricesData.map(rp => {
    const p = allProducts.find(x => x.id === rp.productId);
    if (!p) return null;
    return { 
      id: p.id, 
      name: p.name, 
      sku: p.symbol, // STRICT TYPING
      customPrice: (rp.priceNet / 100).toFixed(2) 
    };
  }).filter(Boolean);

  const initialLimit = company.limitNet ? (company.limitNet / 100).toFixed(2) : "";

  const toggleStatus = async () => {
    "use server";
    const newStatus = company.status === "active" ? "blocked" : "active";
    await db.update(companies).set({ status: newStatus as any }).where(eq(companies.id, company.id));
    revalidatePath("/panel/b2b");
    revalidatePath(`/panel/b2b/${company.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10 mt-10">
      <div className="bg-brand-bg p-8 rounded-card border border-brand-border flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-brand-ink">{company.name}</h1>
          <p className="text-brand-muted mt-1">NIP: {company.nip} | {company.contactEmail}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className={`px-4 py-1.5 rounded-pill text-sm font-bold ${company.status === 'active' ? 'bg-brand-soft text-brand-primary' : 'bg-red-100 text-red-700'}`}>
            {company.status === 'active' ? 'Konto Aktywne' : 'Konto Zablokowane'}
          </span>
          <form action={toggleStatus}>
            <button className={`text-xs font-bold px-4 py-2 rounded-pill transition cursor-pointer ${company.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-brand-soft text-brand-primary hover:opacity-80'}`}>
              {company.status === 'active' ? 'Zablokuj klienta' : 'Odblokuj klienta'}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          <div className="bg-brand-bg p-8 rounded-card border border-brand-border">
            <h2 className="text-xl font-bold mb-6 text-brand-ink">Edycja Warunków Handlowych</h2>
            <ConditionsForm 
              companyId={company.id} 
              brands={allBrands} 
              initialDiscounts={initialDiscounts}
              initialPaymentTerm={company.paymentTerm || "prepayment"}
              initialCreditLimit={initialLimit}
              initialCustomPrices={initialCustomPrices}
            />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-amber-50 p-6 rounded-card border border-amber-200">
            <h3 className="font-bold text-amber-900 mb-2">Zmiany do zatwierdzenia</h3>
            <p className="text-sm text-amber-700 mb-4">Klient nie zgłosił żadnych zmian w danych rejestrowych.</p>
          </div>

          <div className="bg-brand-surface p-6 rounded-card border border-brand-border">
            <h3 className="font-bold text-brand-ink mb-2">Ostatnie zamówienia</h3>
            <p className="text-sm text-brand-muted">Brak historii zamówień w systemie.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
