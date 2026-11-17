"use client";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Users, UserPlus, Package, ShoppingCart, Inbox, Store, LogOut, ChevronDown } from "lucide-react";
import { NavList } from "@/components/nav/NavList";
import { getAdminCounters } from "@/actions/counters";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface AdminSidebarProps {
  initialCounters: { pendingClients: number; newOrders: number; unreadMessages: number };
  brands: { slug: string; name: string; domain: string | null }[];
  userEmail: string;
  children: React.ReactNode;
}

export function AdminSidebar({ initialCounters, brands, userEmail, children }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [counters, setCounters] = useState(initialCounters);
  const drawerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchCounters = () => getAdminCounters().then(setCounters);
    window.addEventListener("focus", fetchCounters);
    return () => window.removeEventListener("focus", fetchCounters);
  }, []);

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

  if (pathname.includes("/logowanie")) {
    return <div className="min-h-screen bg-brand-surface">{children}</div>;
  }

  // ZGODNE Z TWOIM TERMINALEM: b2b oraz katalog
  const mainNav = [
    { href: "/panel/klienci-oczekujacy", label: "Klienci oczekujący", icon: <UserPlus size={20}/>, badge: counters.pendingClients },
    { href: "/panel/b2b", label: "Klienci B2B", icon: <Users size={20}/> },
    { href: "/panel/katalog", label: "Katalog produktów", icon: <Package size={20}/> },
    { href: "/panel/zamowienia", label: "Zamówienia", icon: <ShoppingCart size={20}/>, badge: counters.newOrders },
    { href: "/panel/skrzynka", label: "Skrzynka", icon: <Inbox size={20}/>, badge: counters.unreadMessages },
  ];

  const secondaryNav = [
    { href: "/panel/marki", label: "Marki i sklepy", icon: <Store size={20}/> },
  ];

  const segments = pathname.split('/').filter(Boolean);
  let breadcrumb = "Panel Administracyjny";
  if (segments.includes("katalog")) breadcrumb = "Katalog produktów";
  if (segments.includes("b2b")) breadcrumb = "Klienci B2B";
  if (segments.includes("zamowienia")) breadcrumb = "Zamówienia";
  if (segments.includes("marki")) breadcrumb = "Marki i sklepy";
  if (segments.includes("klienci-oczekujacy")) breadcrumb = "Klienci oczekujący";

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-brand-bg w-[260px] border-r border-brand-border p-6 shadow-sm">
      <div className="mb-10">
        <img src="/logo-IT.png" alt="Italgroup Logo" className="h-10 object-contain" />
      </div>
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
        <NavList items={mainNav} onItemClick={() => setIsOpen(false)} />
        <div>
          <div className="h-px bg-brand-border mb-4 w-full"></div>
          <NavList items={secondaryNav} onItemClick={() => setIsOpen(false)} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-brand-surface w-full">
      <aside className="hidden lg:block shrink-0">
        <SidebarContent />
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-brand-text/20 backdrop-blur-sm" aria-hidden="true" />
          <div ref={drawerRef} role="dialog" aria-modal="true" className="relative h-full flex transform transition-transform">
             <SidebarContent />
             <button onClick={() => setIsOpen(false)} className="absolute top-6 right-[-48px] bg-brand-bg p-2 rounded-r-pill shadow-md outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
               <X size={24} />
             </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-brand-bg border-b border-brand-border px-6 flex items-center justify-between shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsOpen(true)} className="lg:hidden p-2 -ml-2 text-brand-text hover:bg-brand-surface rounded-pill outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
              <Menu size={24} />
            </button>
            <h1 className="font-semibold text-lg text-brand-text hidden sm:block">{breadcrumb}</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="group relative">
              <button className="flex items-center gap-2 px-4 py-2 bg-brand-surface rounded-pill text-sm font-semibold hover:bg-brand-accent transition outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
                Podgląd sklepu <ChevronDown size={16} className="text-brand-textsec group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-brand-bg border border-brand-border rounded-card shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                {brands.map(b => {
                   const url = b.domain ? `https://${b.domain}` : (process.env.NEXT_PUBLIC_SHOP_PREVIEW_BASE_URL ? `${process.env.NEXT_PUBLIC_SHOP_PREVIEW_BASE_URL}?shop=${b.slug}` : `http://localhost:3001?shop=${b.slug}`);
                   return (
                     <a key={b.slug} href={url} target="_blank" rel="noopener noreferrer" className="block px-4 py-3 text-sm hover:bg-brand-surface font-semibold text-brand-text">
                       {b.name}
                     </a>
                   );
                })}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4 border-l border-brand-border pl-6">
              <span className="text-sm font-semibold text-brand-textsec">{userEmail}</span>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="text-brand-text hover:text-red-600 transition outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-pill p-1" title="Wyloguj">
                  <LogOut size={20} />
                </button>
              </form>
            </div>
          </div>
        </header>
        <main id="main-content" className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
