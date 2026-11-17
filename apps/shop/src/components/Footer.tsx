import React from "react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";

export function Footer() {
  const { shop } = useShop();

  return (
    <footer className="bg-shop-navy text-white mt-20">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="space-y-3">
          <p className="text-lg font-bold tracking-[0.2em] uppercase">{shop.name}</p>
          <p className="text-sm text-white/75">
            Oficjalny sklep detaliczny. Wszystkie ceny zawierają podatek VAT.
          </p>
        </div>

        <div className="space-y-2 text-sm text-white/80">
          <p className="font-bold text-white uppercase tracking-wider text-xs mb-2">
            Dane sprzedawcy
          </p>
          <p className="font-semibold text-white">{shop.seller.companyName}</p>
          <p>{shop.seller.address}</p>
          <p>NIP: {shop.seller.nip}</p>
          <p>
            E-mail:{" "}
            <a href={`mailto:${shop.seller.email}`} className="underline hover:text-white">
              {shop.seller.email}
            </a>
          </p>
        </div>

        <div className="space-y-2 text-sm text-white/80">
          <p className="font-bold text-white uppercase tracking-wider text-xs mb-2">
            Informacje prawne i obsługa
          </p>
          <ul className="space-y-2">
            <li>
              <Link to="/zamowienia" className="hover:underline">
                Sprawdź status zamówienia
              </Link>
            </li>
            <li>
              <Link to="/regulamin" className="hover:underline">
                Regulamin sklepu
              </Link>
            </li>
            <li>
              <Link to="/polityka-prywatnosci" className="hover:underline">
                Polityka prywatności
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {shop.seller.companyName}. Wszelkie prawa zastrzeżone.
      </div>
    </footer>
  );
}
