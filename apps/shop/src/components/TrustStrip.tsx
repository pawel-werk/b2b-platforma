import React from "react";
import { Link } from "react-router-dom";
import { Truck, Receipt, PackageSearch } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { formatGrosze } from "../lib/format";

export function TrustStrip() {
  const { shop } = useShop();
  const threshold = shop.deliverySettings?.freeShippingThresholdGrossGrosze ?? 0;
  const enabledMethodsCount =
    shop.deliverySettings?.methods.filter((m) => m.enabled).length ?? 0;

  return (
    <section
      aria-label="Informacje o zakupach"
      className="border-t border-b border-shop-line py-12 md:py-16"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-shop-line">
        {/* Kolumna 1: Dostawa z deliverySettings */}
        <div className="py-6 md:py-2 md:pr-10 space-y-3">
          <Truck className="w-5 h-5 text-shop-ink" strokeWidth={1.25} aria-hidden="true" />
          <p className="label text-shop-ink">Dostawa</p>
          <p className="text-sm font-light text-shop-muted leading-relaxed">
            {threshold > 0
              ? `Darmowa dostawa dla zamówień od ${formatGrosze(threshold)}.`
              : enabledMethodsCount > 0
              ? `Dostępne metody dostawy (${enabledMethodsCount}) widoczne w koszyku.`
              : "Koszt i forma dostawy kalkulowane w koszyku."}
          </p>
        </div>

        {/* Kolumna 2: VAT i faktura */}
        <div className="py-6 md:py-2 md:px-10 space-y-3">
          <Receipt className="w-5 h-5 text-shop-ink" strokeWidth={1.25} aria-hidden="true" />
          <p className="label text-shop-ink">Rozliczenie</p>
          <p className="text-sm font-light text-shop-muted leading-relaxed">
            Ceny zawierają VAT, faktura na firmę na życzenie.
          </p>
        </div>

        {/* Kolumna 3: Status zamówienia bez logowania */}
        <div className="py-6 md:py-2 md:pl-10 space-y-3">
          <PackageSearch
            className="w-5 h-5 text-shop-ink"
            strokeWidth={1.25}
            aria-hidden="true"
          />
          <p className="label text-shop-ink">Zamówienia</p>
          <p className="text-sm font-light text-shop-muted leading-relaxed">
            Status zamówienia sprawdzisz bez logowania.{" "}
            <Link
              to="/zamowienia"
              className="text-shop-ink underline underline-offset-4 decoration-shop-line hover:decoration-shop-ink transition-colors"
            >
              Sprawdź status
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}