import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";

export function LegalPage({ title }: { title: string }) {
  const { shop } = useShop();

  useEffect(() => {
    document.title = `${title} | ${shop.name}`;
  }, [title, shop.name]);

  return (
    <main className="max-w-[68ch] mx-auto px-6 md:px-10 py-20 md:py-28 space-y-8">
      <header className="space-y-3">
        <p className="label">Informacje prawne</p>
        <h1 className="font-display font-normal text-[clamp(36px,4vw,56px)] tracking-[-0.01em] leading-[1.05] text-shop-ink">
          {title}
        </h1>
      </header>

      <div className="pt-8 border-t border-shop-line space-y-4 text-sm md:text-base font-light text-shop-muted leading-relaxed">
        <p className="font-normal text-shop-ink">
          Administratorem i sprzedawcą w sklepie {shop.name} jest{" "}
          {shop.seller.companyName} ({shop.seller.address}, NIP: {shop.seller.nip}).
        </p>
        <p>
          Strona zastępcza dokumentu „{title}” przygotowana do uzupełnienia pełną
          treścią prawną przed startem produkcyjnym.
        </p>
      </div>
    </main>
  );
}

export function NotFoundPage() {
  const { shop } = useShop();

  useEffect(() => {
    document.title = `404 – Nie znaleziono strony | ${shop.name}`;
  }, [shop.name]);

  return (
    <main className="max-w-xl mx-auto px-6 py-24 md:py-32 text-center space-y-6">
      <p className="label text-shop-bronze">Błąd 404</p>
      <h1 className="font-display font-normal text-[clamp(36px,4vw,56px)] tracking-[-0.01em] leading-[1.05] text-shop-ink">
        Strona nie została znaleziona
      </h1>
      <p className="text-sm font-light text-shop-muted leading-relaxed">
        Adres, którego szukasz, nie istnieje lub został przeniesiony.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex h-12 items-center justify-center px-8 rounded-[2px] border border-shop-ink bg-shop-ink text-shop-bg text-[12px] font-normal uppercase tracking-[0.14em] transition-colors duration-300 hover:bg-transparent hover:text-shop-ink"
        >
          Wróć na stronę główną
        </Link>
      </div>
    </main>
  );
}