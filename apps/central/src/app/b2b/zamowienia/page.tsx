import { db } from "@/db";
import { orders, orderNotes } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function B2BOrdersPage() {
  const session = await auth();
  if (!session || session.user.role !== "company") redirect("/b2b/logowanie");
  
  const companyId = session.user.companyId!;
  
  const myOrders = await db.select().from(orders).where(eq(orders.companyId, companyId)).orderBy(desc(orders.createdAt));
  
  let notes: any[] = [];
  if (myOrders.length > 0) {
    const orderIds = myOrders.map(o => o.id);
    notes = await db.select().from(orderNotes).where(inArray(orderNotes.orderId, orderIds)).orderBy(desc(orderNotes.createdAt));
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-brand-ink">Moje zamówienia</h1>

      <div className="bg-white rounded-card border border-brand-border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-surface text-brand-muted border-b border-brand-border">
            <tr>
              <th className="p-4">Numer zamówienia</th>
              <th className="p-4">Data złożenia</th>
              <th className="p-4 text-right">Wartość netto</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4">Ostatnia wiadomość</th>
              <th className="p-4 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {myOrders.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-brand-muted">Nie złożyłeś jeszcze żadnego zamówienia.</td></tr>
            ) : (
              myOrders.map(o => {
                const lastNote = notes.find(n => n.orderId === o.id && n.isVisibleToCustomer);
                
                return (
                  <tr key={o.id} className="border-b border-brand-border hover:bg-brand-surface transition">
                    <td className="p-4 font-bold text-brand-ink">{o.orderNumber}</td>
                    <td className="p-4 font-semibold text-brand-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right font-bold">{(o.sumNet / 100).toFixed(2)} PLN</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-pill text-xs font-bold ${o.fulfillmentStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {o.fulfillmentStatus.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-brand-muted max-w-[200px] truncate">
                      {lastNote ? lastNote.content : "Brak wiadomości"}
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/b2b/zamowienia/${o.id}`} className="bg-brand-surface border border-brand-border px-4 py-2 rounded-lg text-brand-ink font-bold hover:bg-brand-soft transition">
                        Szczegóły
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
