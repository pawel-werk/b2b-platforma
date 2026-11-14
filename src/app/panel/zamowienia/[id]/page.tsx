import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateOrderStatus } from "../actions";

export default async function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, params.id)
  });

  if (!order) notFound();

  const items = await db.select({
    id: orderItems.id,
    quantity: orderItems.quantity,
    priceGross: orderItems.priceGross,
    productName: products.name,
    productSymbol: products.symbol,
  })
  .from(orderItems)
  .leftJoin(products, eq(orderItems.productId, products.id))
  .where(eq(orderItems.orderId, order.id));

  // Tłumaczenia i kolory statusów
  const statusConfig: Record<string, { label: string; color: string }> = {
    new: { label: "Nowe", color: "bg-amber-100 text-amber-800" },
    paid: { label: "Opłacone", color: "bg-blue-100 text-blue-800" },
    completed: { label: "Zrealizowane", color: "bg-green-100 text-green-800" },
    cancelled: { label: "Anulowane", color: "bg-red-100 text-red-800" },
  };

  const currentStatus = statusConfig[order.status] || { label: order.status, color: "bg-slate-100 text-slate-800" };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Szczegóły zamówienia</h1>
        <Link href="/panel/zamowienia" className="text-slate-500 hover:underline">&larr; Wróć do listy</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white border rounded-lg overflow-hidden self-start">
          <div className="p-4 border-b bg-slate-50 font-bold">Zakupione produkty</div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-slate-600">
              <tr>
                <th className="p-4">Symbol</th>
                <th className="p-4">Nazwa</th>
                <th className="p-4 text-center">Ilość</th>
                <th className="p-4 text-right">Cena (szt)</th>
                <th className="p-4 text-right">Suma brutto</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="p-4 font-mono text-xs text-slate-500">{item.productSymbol}</td>
                  <td className="p-4 font-medium">{item.productName || "Produkt usunięty"}</td>
                  <td className="p-4 text-center">{item.quantity}</td>
                  <td className="p-4 text-right">{(item.priceGross / 100).toFixed(2)} zł</td>
                  <td className="p-4 text-right font-bold">{((item.priceGross * item.quantity) / 100).toFixed(2)} zł</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border rounded-lg p-6 self-start">
          <h2 className="font-bold text-lg mb-4">Informacje</h2>
          <div className="mb-4">
            <div className="text-xs text-slate-500 uppercase">Klient (E-mail)</div>
            <div className="font-medium text-blue-600">{order.customerEmail}</div>
          </div>
          <div className="mb-4">
            <div className="text-xs text-slate-500 uppercase">Data złożenia</div>
            <div>{order.createdAt.toLocaleString("pl-PL")}</div>
          </div>
          
          <div className="mb-4 border-t pt-4 mt-4">
            <div className="text-xs text-slate-500 uppercase mb-2">Obecny Status</div>
            <span className={`px-2 py-1 rounded text-xs uppercase font-bold tracking-wider ${currentStatus.color}`}>
              {currentStatus.label}
            </span>

            {/* FORMULARZ ZMIANY STATUSU */}
            <form action={async (formData) => {
              "use server";
              await updateOrderStatus(order.id, formData.get("status") as string);
            }} className="mt-4 flex flex-col gap-2">
              <label className="text-xs text-slate-500 font-medium">Zmień status na:</label>
              <div className="flex gap-2">
                <select name="status" defaultValue={order.status} className="border text-sm p-2 rounded flex-1 bg-white">
                  <option value="new">Nowe</option>
                  <option value="paid">Opłacone</option>
                  <option value="completed">Zrealizowane</option>
                  <option value="cancelled">Anulowane</option>
                </select>
                <button type="submit" className="bg-slate-900 text-white px-4 py-2 text-sm rounded hover:bg-slate-800 transition">
                  Zapisz
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="text-xs text-slate-500 uppercase mb-1">Razem do zapłaty (brutto)</div>
            <div className="text-2xl font-bold text-slate-900">{(order.totalGross / 100).toFixed(2)} zł</div>
          </div>
        </div>
      </div>
    </div>
  );
}