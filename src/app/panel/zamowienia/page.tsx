import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function OrdersPage() {
  const allOrders = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Zamówienia klientów</h1>
      
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4">ID Zamówienia</th>
              <th className="p-4">Data</th>
              <th className="p-4">E-mail Klienta</th>
              <th className="p-4 text-right">Suma brutto</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {allOrders.map(order => (
              <tr key={order.id} className="border-b hover:bg-slate-50 transition">
                <td className="p-4 font-mono text-xs">
                  {/* Klikalne ID przenoszące do szczegółów */}
                  <Link href={`/panel/zamowienia/${order.id}`} className="text-blue-600 hover:underline font-bold">
                    {order.id.split('-')[0]}...
                  </Link>
                </td>
                <td className="p-4">{order.createdAt.toLocaleString("pl-PL")}</td>
                <td className="p-4 font-medium">{order.customerEmail}</td>
                <td className="p-4 text-right font-bold">{(order.totalGross / 100).toFixed(2)} zł</td>
                <td className="p-4 text-center">
                  <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-800 uppercase font-bold tracking-wider">
                    {order.status === "new" ? "Nowe" : order.status}
                  </span>
                </td>
              </tr>
            ))}
            {allOrders.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Brak zamówień.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}