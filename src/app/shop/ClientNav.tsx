"use client";
import { useCart } from "@/lib/store";
import { useEffect, useState } from "react";
import { switchBrand } from "./actions";
import { logoutB2B } from "./b2b/actions";

export default function ClientNav({ currentBrand, allBrands, b2bCustomer }: { currentBrand: any, allBrands: any[], b2bCustomer: any }) {
  const [mounted, setMounted] = useState(false);
  const items = useCart((state) => state.items);
  const clearCart = useCart((state) => state.clearCart);

  useEffect(() => setMounted(true), []);
  const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleBrandChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    clearCart(); 
    await switchBrand(e.target.value);
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <a href="/shop" className="font-bold text-xl">{currentBrand?.name || "Sklep"}</a>
        <select 
          className="text-sm text-slate-900 bg-white/90 border-0 rounded px-2 py-1 ml-4 cursor-pointer outline-none"
          value={currentBrand?.id || ""}
          onChange={handleBrandChange}
        >
          {allBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-6">
        {b2bCustomer ? (
          <div className="text-sm hidden md:block">
            <span className="font-medium opacity-80">B2B: </span>
            <span className="font-bold mr-2">{b2bCustomer.companyName}</span>
            <button onClick={() => logoutB2B()} className="underline text-xs opacity-70 hover:opacity-100 transition">Wyloguj</button>
          </div>
        ) : (
          <a href="/shop/b2b" className="text-sm font-medium hover:underline opacity-90">Strefa B2B</a>
        )}

        <a href="/shop/koszyk" className="relative p-2 hover:opacity-80 transition">
          <span className="font-medium">Koszyk</span>
          {mounted && itemsCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow border-2 border-white">
              {itemsCount}
            </span>
          )}
        </a>
      </div>
    </>
  );
}