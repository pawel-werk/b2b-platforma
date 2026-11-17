import { db } from "@/db";
import { orders, orderItems, orderNotes } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { addCustomerOrderNote } from "@/actions/b2b-client";

export default async function B2BOrderDetailsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "company") redirect("/b2b/logowanie");
  
  const compId = session.user.companyId!;
  
  const ord = await db.select().from(orders).where(and(eq(orders.id, params.id), eq(orders.companyId, compId)));
  if (!ord.length) return notFound();
  const order = ord[0];

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const rawNotes = await db.select().from(orderNotes).where(eq(orderNotes.orderId, order.id)).orderBy(asc(orderNotes.createdAt));
  const notes = rawNotes.filter(n => n.isVisibleToCustomer);

  const handleNote = async (formData: FormData) => {
    "use server";
    await addCustomerOrderNote(order.id, formData.get("content") as string);
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href="/b2b/zamowienia" className="text-brand-muted hover:text-brand-ink text-sm font-semibold mb-2 block">← Powrót do listy</Link>
        <h1 className="text-3xl font-bold text-brand-ink">Zamówienie {order.orderNumber}</h1>
        <p className="text-brand-muted mt-1">Złożone: {new Date(order.createdAt).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-card border border-brand-border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-surface text-brand-muted border-b border-brand-border">
                <tr>
                  <th className="p-4">Pozycja</th>
                  <th className="p-4 text-center">Ilość</th>
                  <th className="p-4 text-right">Cena jedn. netto</th>
                  <th className="p-4 text-right">Wartość netto</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-brand-border">
                    <td className="p-4">
                      <div className="font-bold text-brand-ink">{item.name}</div>
                      <div className="text-xs text-brand-muted font-mono">{item.symbol}</div>
                    </td>
                    <td className="p-4 text-center font-bold">{item.quantity} szt.</td>
                    <td className="p-4 text-right">{(item.unitPriceNet / 100).toFixed(2)} PLN</td>
                    <td className="p-4 text-right font-bold">{(item.sumNet / 100).toFixed(2)} PLN</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-white p-6 rounded-card border border-brand-border">
            <h3 className="font-bold text-brand-ink mb-4">Wątek komunikacji</h3>
            <div className="space-y-4 mb-6">
              {notes.length === 0 ? <p className="text-sm text-brand-muted">Brak wiadomości.</p> : null}
              {notes.map(n => (
                <div key={n.id} className={`p-4 rounded-lg border ${n.author === 'system' ? 'bg-gray-100 border-gray-200' : n.author === 'customer' ? 'bg-blue-50 border-blue-200 ml-8' : 'bg-brand-surface border-brand-border mr-8'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs uppercase">{n.author === 'customer' ? 'Ty' : n.author === 'system' ? 'System' : 'Obsługa sklepu'}</span>
                    <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm">{n.content}</p>
                </div>
              ))}
            </div>
            
            <form action={handleNote} className="pt-4 border-t border-brand-border flex gap-4">
              <input name="content" required placeholder="Napisz wiadomość do obsługi..." className="flex-1 border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary" />
              <button type="submit" className="bg-brand-ink text-white px-6 rounded-lg font-bold hover:bg-opacity-90 transition">Wyślij</button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-brand-surface p-6 rounded-card border border-brand-border">
            <h3 className="font-bold text-brand-ink mb-4">Podsumowanie kosztów</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span>Razem Netto:</span> <span>{(order.sumNet / 100).toFixed(2)} PLN</span></div>
              <div className="flex justify-between"><span>Kwota VAT:</span> <span>{(order.sumVat / 100).toFixed(2)} PLN</span></div>
              <div className="flex justify-between font-bold text-lg border-t border-brand-border pt-2 mt-2">
                <span>Do zapłaty:</span> <span>{(order.sumGross / 100).toFixed(2)} PLN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
