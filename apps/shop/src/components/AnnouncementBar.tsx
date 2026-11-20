import React from "react";
import { useShop } from "../context/ShopContext";
import { formatGrosze } from "../lib/format";

export function AnnouncementBar() {
  const { shop } = useShop();
  const threshold = shop.deliverySettings?.freeShippingThresholdGrossGrosze ?? 0;

  const message =
    threshold > 0
      ? `Darmowa dostawa od ${formatGrosze(threshold)}`
      : "Ceny zawierają podatek VAT";

  return (
    <div className="h-9 bg-shop-ink text-shop-bg text-[12px] font-light tracking-[0.08em]">
      <div className="max-w-[1520px] mx-auto px-6 md:px-10 h-full relative flex items-center justify-center">
        <p className="truncate text-center">{message}</p>

        {shop.seller?.email && (
          <a
            href={`mailto:${shop.seller.email}`}
            className="hidden md:inline-block absolute right-10 text-shop-bg/75 hover:text-shop-bg transition-colors"
          >
            {shop.seller.email}
          </a>
        )}
      </div>
    </div>
  );
}