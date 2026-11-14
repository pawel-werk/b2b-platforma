import { db } from "@/db";
import { orders, products, brands } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function PanelDashboard() {
  // Pobieramy dane do statystyk
  const allOrders = await db.query.orders.findMany();
  const allProducts = await db.query.products.findMany({ where: eq(products.isDeleted, false) });
  const allBrands = await db.query.brands.findMany({ where: eq(brands.isDeleted, false) });

  // Obliczenia analityczne
  const totalRevenueGross = allOrders.reduce((sum, order) => sum + order.totalGross, 0);
  const newOrdersCount = allOrders.filter(o => o.status === "new").length;
  const outOfStockCount = allProducts.filter(p => p.availability !== "in_stock").length;

  // 5 najnowszych zamówień do szybkiego podglądu
  const recentOrders = [...allOrders]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Pulpit główny</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm text-slate-500 mb-1 font-medium">Całkowity przychód</div>
          <div className="text-3xl font-bold text-slate-900">{(totalRevenueGross / 100).toFixed(2)} zł</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm text-slate-500 mb-1 font-medium">Nowe zamówienia</div>
          <div className="text-3xl font-bold text-blue-600">{newOrdersCount}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm text-slate-500 mb-1 font-medium">Aktywne marki</div>
          <div className="text-3xl font-bold text-purple-600">{allBrands.length}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm text-slate-500 mb-1 font-medium">Braki w magazynie</div>
          <div className="text-3xl font-bold text-red-600">{outOfStockCount}</div>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-lg">Ostatnie zamówienia</h2>
          <Link href="/panel/zamowienia" className="text-sm text-blue-600 hover:underline">Zobacz wszystkie &rarr;</Link>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Klient</th>
              <th className="p-4 text-right">Suma brutto</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(order => (
              <tr key={order.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-4 font-mono text-xs">
                  <Link href={`/panel/zamowienia/${order.id}`} className="text-blue-600 font-bold hover:underline">
                    {order.id.split('-')[0]}
                  </Link>
                </td>
                <td className="p-4 font-medium">{order.customerEmail}</td>
                <td className="p-4 text-right font-bold">{(order.totalGross / 100).toFixed(2)} zł</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${order.status === 'new' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                    {order.status === 'new' ? 'Nowe' : order.status}
                  </span>
                </td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Brak najnowszych zamówień.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}