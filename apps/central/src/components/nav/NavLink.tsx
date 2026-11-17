"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavLinkProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | null;
  onClick?: () => void;
}

export function NavLink({ href, label, icon, badge, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (pathname.startsWith(`${href}/`) && href !== '/panel' && href !== '/b2b');

  return (
    <Link 
      href={href} 
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center justify-between px-4 py-3 rounded-pill text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
        isActive 
          ? "bg-brand-accent text-brand-primary" 
          : "text-brand-text hover:bg-brand-surface hover:text-brand-primary"
      )}
    >
      <div className="flex items-center gap-3">
        {icon && <span className={cn("shrink-0", isActive ? "text-brand-primary" : "text-brand-textsec")}>{icon}</span>}
        <span>{label}</span>
      </div>
      {badge !== undefined && badge !== null && badge > 0 && (
        <span className="bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-pill shrink-0">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
