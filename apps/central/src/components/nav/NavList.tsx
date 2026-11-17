"use client";
import { NavLink, NavLinkProps } from "./NavLink";
import { cn } from "@/lib/utils";

interface NavListProps {
  items: NavLinkProps[];
  onItemClick?: () => void;
  direction?: "row" | "col";
}

export function NavList({ items, onItemClick, direction = "col" }: NavListProps) {
  return (
    <nav 
      className={cn(
        "flex gap-1", 
        direction === "row" ? "flex-row items-center" : "flex-col w-full"
      )} 
      aria-label="Nawigacja główna"
    >
      {items.map((item) => (
        <NavLink 
          key={item.href} 
          {...item} 
          onClick={onItemClick}
        />
      ))}
    </nav>
  );
}
