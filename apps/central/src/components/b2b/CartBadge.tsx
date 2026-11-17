"use client";
import { useCartCount } from "@/lib/cart";

export function CartBadge() {
  const count = useCartCount();
  return (
    <span className="bg-brand-primary text-white text-xs px-2 py-0.5 rounded-full font-bold">
      {count}
    </span>
  );
}
