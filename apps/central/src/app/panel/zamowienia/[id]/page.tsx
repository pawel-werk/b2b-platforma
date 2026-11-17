import { db } from "@/db";
import { orders, orderNotes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { addOrderNote, updateOrderStatus } from "@/actions/orders";

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const ord = await db.select().from(orders).where(eq(orders.id, params.id));
  if (!ord.length) return notFound();
  const order = ord[0];
  
  const notes = await db.select().from(orderNotes).where(eq(orderNotes.orderId, order.id)).orderBy(asc(orderNotes.createdAt));
  const cData: any = order.customerData;

  const handleNote = async (formData: FormData) => {
    "use server";
    await addOrderNote(order.id, formData.get("content") as string, formData.get("visible") === "on");
  };

  const handleStatus = async (formData: FormData) => {
    "use server";
    await updateOrderStatus(order.id, formData.get("status"));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 mt-10 pb-10">
      <div className="flex justify-between items-start">
        <div>
          <Link href="/panel/zamowienia" className="text-brand-muted hover:text-brand-ink text-sm font-semibold mb-2 block">← Powrót do zamówień</Link>
          <h1 className="text-3xl font-bold text-brand-ink">Zamówienie {order.orderNumber}</h1>
          <p className="text-brand-muted mt-1">{new Date(order.createdAt).toLocaleString()} | Źródło: {order.source.toUpperCase()}</p>
        </div>
        <div className="bg-brand-surface p-4 rounded-card border border-brand-border flex gap-4 items-center">
          <span className="font-bold text-sm text-brand-ink">Status:</span>
          <form action={handleStatus} className="flex gap-2">
            <select name="status" defaultValue={order.fulfillmentStatus} className="border border-brand-border p-2 rounded outline-none text-sm font-semibold">
              <option value="new">Nowe</option>
              <option value="in_progress">W realizacji</option>
              <option value="partially_completed">Częściowo zrealizowane</option>
              <option value="completed">Zrealizowane</option>
              <option value="cancelled">Anulowane</option>
            </select>
            <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded text-sm font-bold hover:bg-opacity-90 transition">Zmień</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          <div className="bg-brand-bg border border-brand-border rounded-card p-6">
            <h2 className="text-xl font-bold text-brand-ink mb-4">Pozycje zamówienia (Przykładowe)</h2>
            <div className="p-8 text-center text-brand-muted border-2 border-dashed border-brand-border rounded-lg bg-brand-surface">
              <p>Tu wyświetli się koszyk wyciągnięty z tabeli `order_items`.</p>
              <p className="font-bold text-xl mt-4 text-brand-ink">Razem: {(order.sumGross / 100).toFixed(2)} PLN brutto</p>
            </div>
          </div>

          <div className="bg-brand-bg border border-brand-border rounded-card p-6">
            <h2 className="text-xl font-bold text-brand-ink mb-4">Wątek notatek</h2>
            <div className="space-y-4 mb-6">
              {notes.length === 0 ? <p className="text-sm text-brand-muted">Brak notatek do tego zamówienia.</p> : null}
              {notes.map(n => (
                <div key={n.id} className={`p-4 rounded-lg border ${n.author === 'system' ? 'bg-gray-100 border-gray-200' : n.author === 'customer' ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs uppercase">{n.author} {n.isVisibleToCustomer && "(Widoczne dla klienta)"}</span>
                    <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm">{n.content}</p>
                </div>
              ))}
            </div>
            
            <form action={handleNote} className="space-y-4 pt-4 border-t border-brand-border">
              <textarea name="content" required placeholder="Napisz notatkę..." className="w-full border border-brand-border p-3 rounded-lg outline-none focus:border-brand-primary min-h-[100px]"></textarea>
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="visible" className="w-4 h-4 accent-brand-primary" />
                  <span className="text-sm font-semibold">Widoczna dla klienta w panelu B2B</span>
                </label>
                <button type="submit" className="bg-brand-ink text-white px-6 py-2 rounded-pill font-bold">Dodaj notatkę</button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-brand-bg border border-brand-border rounded-card p-6">
            <h3 className="font-bold text-brand-ink mb-4">Dane klienta</h3>
            <p className="font-semibold">{cData?.name}</p>
            {cData?.nip && <p className="text-sm text-brand-muted">NIP: {cData.nip}</p>}
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-card p-6">
            <h3 className="font-bold text-brand-ink mb-4">Płatność</h3>
            <p className="text-sm"><span className="font-semibold">Status:</span> <span className="uppercase text-amber-600 font-bold">{order.paymentStatus}</span></p>
            <p className="text-sm mt-2"><span className="font-semibold">Termin:</span> {order.paymentTerm}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
