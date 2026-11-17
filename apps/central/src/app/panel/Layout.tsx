import { Logo } from "@/components/Logo";
import { Users, Building2, PackageSearch, ShoppingBag, Inbox, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/auth";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-surface flex flex-col">
      {/* Nagłówek i Nawigacja */}
      <header className="bg-brand-bg border-b border-brand-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Logo />
            <nav className="hidden md:flex items-center gap-1">
              <NavItem href="/panel/klienci-oczekujacy" icon={Users} label="Klienci oczekujący" count={2} active />
              <NavItem href="/panel/b2b" icon={Building2} label="Klienci B2B" />
              <NavItem href="/panel/produkty" icon={PackageSearch} label="Katalog produktów" />
              <NavItem href="/panel/zamowienia" icon={ShoppingBag} label="Zamówienia" />
              <NavItem href="/panel/skrzynka" icon={Inbox} label="Skrzynka" count={5} />
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-brand-ink hidden sm:block">
              Administrator
            </div>
            <form action={async () => { "use server"; await signOut(); }}>
              <button type="submit" className="p-2 text-brand-muted hover:text-brand-ink hover:bg-brand-surface rounded-pill transition">
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Główna zawartość */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, count, active }: any) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-2 px-4 py-2 rounded-pill text-sm font-semibold transition ${
        active 
          ? "bg-brand-primary text-white" 
          : "text-brand-muted hover:bg-brand-soft hover:text-brand-primary"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`ml-1 flex items-center justify-center h-5 min-w-[20px] rounded-pill text-xs font-bold px-1.5 ${
          active ? "bg-white text-brand-primary" : "bg-brand-primary text-white"
        }`}>
          {count}
        </span>
      )}
    </Link>
  );
}