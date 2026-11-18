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
  const pathname = usePathname();

  useEffect(() => {
    const fetchCounters = () => getAdminCounters().then(setCounters).catch(() => {});
    window.addEventListener("focus", fetchCounters);
    return () => window.removeEventListener("focus", fetchCounters);
  }, []);

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

  return (
    <div className="flex min-h-screen bg-red-100 w-full">
      {/* TESTOWY PANEL BOCZNY - JASKRAWY ŻÓŁTY */}
      <aside className="shrink-0 w-[280px] bg-yellow-300 border-r-4 border-red-600 p-6 min-h-screen">
        <div className="mb-6 bg-red-600 text-white p-3 font-bold text-center">
          TUTAJ JEST MENU ADMINA!
        </div>
        <div className="flex flex-col gap-2">
          {mainNav.map((item) => (
            <a key={item.href} href={item.href} className="block p-3 bg-white rounded font-bold text-black hover:bg-gray-100">
              {item.label}
            </a>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* TESTOWY NAGŁÓWEK */}
        <header className="h-20 bg-blue-600 text-white px-6 flex items-center justify-between shrink-0">
          <h1 className="font-bold text-xl">{breadcrumb}</h1>
          <div>{userEmail}</div>
        </header>

        {/* Główna treść */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}