"use client";
import { usePathname } from "next/navigation";
import { B2BHeader } from "./B2BHeader";

export function B2BLayoutClient({ companyId, companyName, children }: { companyId: string, companyName: string, children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname.includes("/logowanie")) {
    return <div className="min-h-screen bg-brand-surface">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-brand-surface flex flex-col">
      <B2BHeader companyId={companyId} companyName={companyName} />
      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
