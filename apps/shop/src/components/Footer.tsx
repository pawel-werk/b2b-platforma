import React from "react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";

export function Footer() {
  const { shop, catalog } = useShop();
  const footerCategories = catalog.categories.slice(0, 8);

  return (
    <footer className="bg-shop-footer text-shop-footerText mt-20">
      <div className="max-w-[1520px] mx-auto px-6 md:px-10 pt-20 pb-16 space-y-16">
        {/* Góra: Wordmark + neutralne zdanie opisu */}
        <div className="space-y-4 max-w-2xl">
          <p className="font-display text-[36px] md:text-[48px] font-normal tracking-[-0.01em] leading-[1.05] text-shop-footerText">
            {shop.name}
          </p>
          <p className="text-sm font-light text-shop-footerText/70 leading-relaxed">
            Oficjalny sklep marki {shop.name}. Wszystkie ceny zawierają podatek VAT.
          </p>
        </div>

        {/* Kolumny: 4 na desktop (Sklep rozłożony na 2 kolumny, Obsługa, Sprzedawca) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 pt-12 border-t border-white/10">
          <div className="lg:col-span-2 space-y-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-shop-footerText/55">
              Sklep
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm font-light">
              <li>
                <Link
                  to="/sklep"
                  className="text-shop-footerText/85 hover:text-shop-footerText hover:underline underline-offset-4 decoration-1 transition-opacity"
                >
                  Wszystkie produkty
                </Link>
              </li>
              {footerCategories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    to={`/sklep/${cat.slug}`}
                    className="text-shop-footerText/85 hover:text-shop-footerText hover:underline underline-offset-4 decoration-1 transition-opacity"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-shop-footerText/55">
              Obsługa
            </p>
            <ul className="space-y-2.5 text-sm font-light">
              <li>
                <Link
                  to="/zamowienia"
                  className="text-shop-footerText/85 hover:text-shop-footerText hover:underline underline-offset-4 decoration-1 transition-opacity"
                >
                  Sprawdź status zamówienia
                </Link>
              </li>
              <li>
                <Link
                  to="/regulamin"
                  className="text-shop-footerText/85 hover:text-shop-footerText hover:underline underline-offset-4 decoration-1 transition-opacity"
                >
                  Regulamin sklepu
                </Link>
              </li>
              <li>
                <Link
                  to="/polityka-prywatnosci"
                  className="text-shop-footerText/85 hover:text-shop-footerText hover:underline underline-offset-4 decoration-1 transition-opacity"
                >
                  Polityka prywatności
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4 text-sm font-light text-shop-footerText/80">
            <p className="text-[11px] uppercase tracking-[0.18em] text-shop-footerText/55">
              Sprzedawca
            </p>
            <div className="space-y-1.5 leading-relaxed">
              <p className="font-normal text-shop-footerText">{shop.seller.companyName}</p>
              <p>{shop.seller.address}</p>
              <p>NIP: {shop.seller.nip}</p>
              <p className="pt-1">
                <a
                  href={`mailto:${shop.seller.email}`}
                  className="text-shop-footerText/85 hover:text-shop-footerText hover:underline underline-offset-4 decoration-1 transition-opacity"
                >
                  {shop.seller.email}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dół */}
      <div className="border-t border-white/10">
        <div className="max-w-[1520px] mx-auto px-6 md:px-10 py-6 text-xs font-light text-shop-footerText/55">
          © {new Date().getFullYear()} {shop.seller.companyName}
        </div>
      </div>
    </footer>
  );
}