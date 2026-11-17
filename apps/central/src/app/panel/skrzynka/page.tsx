import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function InboxPage({ searchParams }: { searchParams: { filter?: string } }) {
  const filter = searchParams.filter || "all";
  
  let query = db.select().from(notifications).orderBy(desc(notifications.createdAt));
  const allNotifs = await query;
  
  const filtered = allNotifs.filter(n => {
    if (filter === "unread" && n.readAt) return false;
    return true;
  });

  const markAsRead = async (id: string) => {
    "use server";
    await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, id));
    revalidatePath("/panel/skrzynka");
  };

  const markAllRead = async () => {
    "use server";
    await db.update(notifications).set({ readAt: new Date() });
    revalidatePath("/panel/skrzynka");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 mt-10 pb-10">
      <div className="flex justify-between items-end">
        <h1 className="text-3xl font-bold text-brand-ink">Skrzynka odbiorcza</h1>
        <form action={markAllRead}>
          <button className="text-brand-primary font-semibold hover:underline text-sm">Oznacz wszystkie jako przeczytane</button>
        </form>
      </div>

      <div className="flex gap-4 border-b border-brand-border pb-4">
        <Link href="?filter=all" className={`font-semibold ${filter === 'all' ? 'text-brand-primary' : 'text-brand-muted'}`}>Wszystkie</Link>
        <Link href="?filter=unread" className={`font-semibold ${filter === 'unread' ? 'text-brand-primary' : 'text-brand-muted'}`}>Nieprzeczytane</Link>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-brand-muted bg-brand-surface rounded-card border border-brand-border">
            Brak powiadomień. Jesteś na bieżąco!
          </div>
        ) : (
          filtered.map(n => (
            <div key={n.id} className={`p-6 rounded-card border transition flex gap-6 items-start ${!n.readAt ? 'bg-white border-brand-primary shadow-sm' : 'bg-brand-surface border-brand-border opacity-75'}`}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  {!n.readAt && <span className="w-2 h-2 rounded-full bg-brand-primary"></span>}
                  <span className="text-xs font-bold text-brand-muted uppercase">{n.type.replace("_", " ")}</span>
                  <span className="text-xs text-brand-muted">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <h3 className="font-bold text-brand-ink text-lg">{n.title}</h3>
                <p className="text-brand-ink mt-2 text-sm">{n.content}</p>
                {n.relatedId && (
                  <div className="mt-4">
                     <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">Powiązany ID: {n.relatedId}</span>
                  </div>
                )}
              </div>
              
              {!n.readAt && (
                <form action={async () => { "use server"; await markAsRead(n.id); }}>
                  <button className="text-brand-primary border border-brand-primary px-4 py-2 rounded-pill text-xs font-bold hover:bg-brand-soft transition">
                    Przeczytane
                  </button>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
