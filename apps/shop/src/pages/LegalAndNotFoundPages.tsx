import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";

export function LegalPage({ title }: { title: string }) {
  const { shop } = useShop();

  useEffect(() => {
    document.title = `${title} | ${shop.name}`;
  }, [title, shop.name]);

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-8 py-16 space-y-6">
      <h1 className="text-3xl font-bold text-shop-text">{title}</h1>
      <div className="p-6 rounded-card bg-shop-surface border border-shop-border space-y-3 text-sm text-shop-muted leading-relaxed">
        <p className="font-semibold text-shop-text">
          Administratorem i sprzedawcą w sklepie {shop.name} jest {shop.seller.companyName} ({shop.seller.address}, NIP: {shop.seller.nip}).
        </p>
        <p>
          Strona zastępcza dokumentu „{title}” przygotowana do uzupełnienia pełną treścią prawną przed startem produkcyjnym.
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
    <main className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
      <p className="text-sm font-bold uppercase tracking-widest text-shop-accent">Błąd 404</p>
      <h1 className="text-3xl font-bold text-shop-text">Strona nie została znaleziona</h1>
      <p className="text-sm text-shop-muted">
        Adres, którego szukasz, nie istnieje lub został przeniesiony.
      </p>
      <Link
        to="/"
        className="inline-block px-6 py-3 rounded-pill bg-shop-accent text-white font-bold text-sm"
      >
        Wróć na stronę główną
      </Link>
    </main>
  );
}
