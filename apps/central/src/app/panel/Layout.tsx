import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, UserPlus, Package, ShoppingCart, Inbox, Store } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (session?.user?.role === "company") {
    redirect("/b2b/katalog");
  }

  const navItems = [
    { href: "/panel/klienci-oczekujacy", label: "Klienci oczekujący", icon: <UserPlus size={20}/> },
    { href: "/panel/b2b", label: "Klienci B2B", icon: <Users size={20}/> },
    { href: "/panel/katalog", label: "Katalog produktów", icon: <Package size={20}/> },
    { href: "/panel/zamowienia", label: "Zamówienia", icon: <ShoppingCart size={20}/> },
    { href: "/panel/skrzynka", label: "Skrzynka", icon: <Inbox size={20}/> },
    { href: "/panel/marki", label: "Marki i sklepy", icon: <Store size={20}/> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 w-full">
      <aside className="w-[260px] bg-white border-r border-gray-300 flex flex-col h-screen sticky top-0 z-30 shrink-0">
        <div className="p-6 font-bold text-xl border-b border-gray-200">
          ITALGROUP Admin
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg font-semibold text-gray-800 hover:bg-gray-200 transition"
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-gray-300 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <h1 className="font-bold text-lg text-gray-800">Panel Administratora</h1>
          
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-700">
              {session?.user?.email}
            </span>
            
            <form action={async () => {
              "use server";
              await signOut({ redirectTo: "/panel/logowanie" });
            }}>
              <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition shadow-sm">
                Wyloguj
              </button>
            </form>
          </div>
        </header>

        <main className="p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}