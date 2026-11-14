import { auth, signOut } from "@/auth";
import { Toaster } from "@/components/ui/sonner";

export const instant = false;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {session && (
        <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-sm">
          <div className="font-bold text-xl flex gap-6 items-center">
            <span>Panel Zarządzania</span>
            <nav className="text-sm font-normal flex gap-4">
              <a href="/panel" className="hover:underline">Pulpit</a>
              <a href="/panel/produkty" className="hover:underline">Produkty</a>
              <a href="/panel/zamowienia" className="hover:underline text-blue-300">Zamówienia</a>
              <a href="/panel/marki" className="hover:underline text-purple-300">Marki</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">{session.user?.email}</span>
            <form action={async () => { "use server"; await signOut(); }}>
              <button className="bg-slate-700 px-4 py-2 rounded text-sm hover:bg-slate-600 transition">
                Wyloguj
              </button>
            </form>
          </div>
        </header>
      )}
      <main className="p-8 flex-1">
        {children}
      </main>
      <Toaster />
    </div>
  );
}