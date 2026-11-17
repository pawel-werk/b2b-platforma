"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, User, ShoppingBag, FolderTree, FileText, LogOut } from "lucide-react";
import { NavList } from "@/components/nav/NavList";
import { useB2BCart } from "@/store/b2b-cart";

export function B2BHeader({ companyId, companyName }: { companyId: string, companyName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  
  const totalItems = useB2BCart(s => s.getTotalItems(companyId));

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) setIsOpen(false); };
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const navItems = [
    { href: "/b2b/dane", label: "Moje dane", icon: <User size={20} /> },
    { href: "/b2b/zamowienia", label: "Moje zamówienia", icon: <FileText size={20} /> },
    { href: "/b2b/katalog", label: "Katalog produktów", icon: <FolderTree size={20} /> },
    { href: "/b2b/koszyk", label: "Koszyk", icon: <ShoppingBag size={20} />, badge: mounted ? totalItems : 0 }
  ];

  return (
    <header className="sticky top-0 z-40 bg-brand-bg border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsOpen(true)} className="lg:hidden p-2 -ml-2 text-brand-text hover:bg-brand-surface rounded-pill focus-visible:ring-2 focus-visible:ring-brand-primary outline-none" aria-label="Otwórz menu">
            <Menu size={24} />
          </button>
          <Link href="/b2b/katalog" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-pill p-1">
             <img src="/logo-IT.png" alt="Italgroup Logo" className="h-8 object-contain" />
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {/* TO NAPRAWIA PROBLEM: direction="row" układa przyciski obok siebie */}
          <NavList items={navItems} direction="row" />
        </nav>

        <div className="hidden lg:flex items-center gap-4 border-l border-brand-border pl-6 ml-6">
          <span className="font-semibold text-sm text-brand-text truncate max-w-[200px]">{companyName}</span>
          <form action="/api/auth/signout" method="POST">
             <button type="submit" className="text-brand-textsec hover:text-red-600 p-2 rounded-pill focus-visible:ring-2 focus-visible:ring-red-500 outline-none transition" aria-label="Wyloguj" title="Wyloguj">
               <LogOut size={20} />
             </button>
          </form>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-brand-text/20 backdrop-blur-sm" aria-hidden="true" />
          <div ref={drawerRef} role="dialog" aria-modal="true" aria-label="Nawigacja mobilna" className="relative w-4/5 max-w-sm bg-brand-bg h-full p-6 shadow-xl flex flex-col gap-8 transform transition-transform">
            <div className="flex justify-between items-center">
              <img src="/logo-IT.png" alt="Italgroup Logo" className="h-8 object-contain" />
              <button onClick={() => setIsOpen(false)} className="p-2 text-brand-text hover:bg-brand-surface rounded-pill outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList items={navItems} onItemClick={() => setIsOpen(false)} />
            </div>
            <div className="pt-6 border-t border-brand-border">
              <p className="font-semibold text-sm text-brand-text mb-4 truncate">{companyName}</p>
              <form action="/api/auth/signout" method="POST">
                 <button type="submit" className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-pill font-semibold text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                   <LogOut size={20} /> Wyloguj
                 </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
