import { auth } from "@/auth";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { getAdminCounters } from "@/actions/counters";
import { AdminSidebar } from "@/components/panel/AdminSidebar";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  if (session?.user?.role === "company") {
    redirect("/b2b/katalog");
  }

  const allBrands = await db.select({ slug: brands.slug, name: brands.name, domain: brands.domain }).from(brands).catch(() => []);
  const counters = await getAdminCounters().catch(() => ({ pendingClients: 0, newOrders: 0, unreadMessages: 0 }));

  return (
    <AdminSidebar 
      initialCounters={counters} 
      brands={allBrands} 
      userEmail={session?.user?.email || "admin@italgroup.pl"}
    >
      {children}
    </AdminSidebar>
  );
}