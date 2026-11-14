import { getTenantBrand, getB2bCustomer } from "@/lib/tenant";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Toaster } from "@/components/ui/sonner";
import ClientNav from "./ClientNav";

// WYMUSZENIE WIDOKU DYNAMICZNEGO:
export const instant = false;

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const currentBrand = await getTenantBrand();
  const b2bCustomer = await getB2bCustomer();
  const allBrands = await db.query.brands.findMany({ where: eq(brands.isDeleted, false) });
  
  let themeColor = "#0f172a"; 
  if (currentBrand?.theme) {
    try { 
      const parsed = JSON.parse(currentBrand.theme);
      if (parsed.color) themeColor = parsed.color;
    } catch(e){}
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="border-b sticky top-0 z-10 shadow-sm transition-colors duration-300" style={{ backgroundColor: themeColor, color: 'white' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
           <ClientNav currentBrand={currentBrand} allBrands={allBrands} b2bCustomer={b2bCustomer} />
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto px-4 w-full">
        {children}
      </main>
      <Toaster />
    </div>
  );
}