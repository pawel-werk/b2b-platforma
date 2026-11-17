import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function OrdersPage({ searchParams }: { searchParams: { tab?: string, q?: string, source?: string } }) {
  const currentTab = searchParams.tab || "all";
  const query = searchParams.q?.toLowerCase() || "";
  const sourceFilter = searchParams.source || "all";

  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));

  const stats = {
    all: allOrders.length,
    new: allOrders.filter(o => o.fulfillmentStatus === "new").length,
    in_progress: allOrders.filter(o => o.fulfillmentStatus === "in_progress").length,
    partially_completed: allOrders.filter(o => o.fulfillmentStatus === "partially_completed").length,
    completed: allOrders.filter(o => o.fulfillmentStatus === "completed").length,
  };

  const filtered = allOrders.filter(o => {
    if (currentTab !== "all" && o.fulfillmentStatus !== currentTab) return false;
    if (sourceFilter !== "all" && o.source !== sourceFilter) return false;
    if (query) {
      const cData: any = o.customerData;
      const matchNum = o.orderNumber.toLowerCase().includes(query);
      const matchCust = cData?.name?.toLowerCase().includes(query) || cData?.nip?.includes(query);
      if (!matchNum && !matchCust) return false;
    }
    return true;
  });

  const tabs = [
    { id: "all", label: "Wszystkie", count: stats.all },
    { id: "new", label: "Nowe", count: stats.new },
    { id: "in_progress", label: "W realizacji", count: stats.in_progress },
    { id: "partially_completed", label: "Częściowo zrealizowane", count: stats.partially_completed },
    { id: "completed", label: "Zrealizowane", count: stats.completed },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 mt-10 pb-10">
      <h1 className="text-3xl font-bold text-brand-ink">Zamówienia</h1>

      <div className="flex border-b border-brand-border gap-6">
        {tabs.map(t => (
          <Link key={t.id} href={`?tab=${t.id}`} className={`pb-3 font-semibold transition ${currentTab === t.id ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-brand-muted hover:text-brand-ink'}`}>
            {t.label} <span className="ml-1 bg-brand-surface text-xs py-0.5 px-2 rounded-full">{t.count}</span>
          </Link>
        ))}
      </div>

      <div className="bg-brand-bg rounded-card border border-brand-border overflow-hidden">
        <div className="p-4 border-b border-brand-border bg-brand-surface flex gap-4">
          <form className="flex-1 flex gap-4">
            <input type="hidden" name="tab" value={currentTab} />
            <input name="q" defaultValue={query} placeholder="Szukaj po numerze lub kliencie..." className="flex-1 border border-brand-border p-2 rounded-lg outline-none" />
            <select name="source" defaultValue={sourceFilter} className="border border-brand-border p-2 rounded-lg outline-none">
              <option value="all">Wszystkie źródła</option>
              <option value="b2b">Tylko B2B</option>
              <option value="shop">Tylko Sklepy</option>
            </select>
            <button type="submit" className="bg-brand-ink text-white px-6 rounded-lg font-bold">Filtruj</button>
          </form>
        </div>
        
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-surface text-brand-muted border-b border-brand-border">
            <tr>
              <th className="p-4">Numer / Data</th>
              <th className="p-4">Klient</th>
              <th className="p-4">Źródło</th>
              <th className="p-4 text-right">Kwota brutto</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-b border-brand-border hover:bg-brand-surface transition">
                <td className="p-4">
                  <div className="font-bold text-brand-ink">{o.orderNumber}</div>
                  <div className="text-xs text-brand-muted">{new Date(o.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="p-4 font-semibold">{(o.customerData as any)?.name}</td>
                <td className="p-4"><span className="bg-gray-200 px-2 py-1 rounded text-xs font-bold uppercase">{o.source}</span></td>
                <td className="p-4 text-right font-bold text-brand-ink">{(o.sumGross / 100).toFixed(2)} PLN</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${o.fulfillmentStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {o.fulfillmentStatus}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Link href={`/panel/zamowienia/${o.id}`} className="text-brand-primary font-bold hover:underline">Szczegóły →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
