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
    const fetchCounters = () => getAdminCounters().then(setCounters).catch(() => {});
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

  if (pathname?.includes("/logowanie")) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

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

  const segments = pathname ? pathname.split('/').filter(Boolean) : [];
  let breadcrumb = "Panel Administracyjny";
  if (segments.includes("katalog")) breadcrumb = "Katalog produktów";
  if (segments.includes("b2b")) breadcrumb = "Klienci B2B";
  if (segments.includes("zamowienia")) breadcrumb = "Zamówienia";
  if (segments.includes("marki")) breadcrumb = "Marki i sklepy";
  if (segments.includes("klienci-oczekujacy")) breadcrumb = "Klienci oczekujący";

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white w-[260px] border-r border-gray-300 p-6 shadow-md z-30">
      <div className="mb-10 flex items-center">
        <span className="font-bold text-xl text-gray-800">ITALGROUP Admin</span>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
        <NavList items={mainNav} onItemClick={() => setIsOpen(false)} />
        <div>
          <div className="h-px bg-gray-200 mb-4 w-full"></div>
          <NavList items={secondaryNav} onItemClick={() => setIsOpen(false)} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100 w-full">
      {/* Zawsze widoczny pasek boczny (usunięto 'hidden lg:block') */}
      <aside className="shrink-0 sticky top-0 h-screen overflow-y-auto bg-white border-r border-gray-300">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Wyraźny, górny nagłówek */}
        <header className="h-20 bg-white border-b-2 border-green-600 px-6 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-xl text-gray-900">{breadcrumb}</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-sm font-semibold text-gray-700">
              {userEmail}
            </div>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-100 transition" title="Wyloguj">
                Wyloguj
              </button>
            </form>
          </div>
        </header>

        {/* Główna treść */}
        <main id="main-content" className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}