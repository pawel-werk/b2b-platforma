export function calculateItemPrice({
  retailPriceNet,
  vatRate,
  individualPriceNet,
  netNetPrice,
  brandDiscountBp,
  quantity = 1,
}: {
  retailPriceNet: number; // grosze
  vatRate: number; // procent (np. 23)
  individualPriceNet?: number | null; // grosze
  netNetPrice?: number | null; // grosze
  brandDiscountBp?: number | null; // punkty bazowe, 2000 = 20%
  quantity?: number;
}) {
  let unitNet = retailPriceNet;

  // 1. Cena indywidualna
  if (individualPriceNet != null) {
    unitNet = individualPriceNet;
  } 
  // 2. Cena net/net produktu
  else if (netNetPrice != null) {
    unitNet = netNetPrice;
  } 
  // 3. Rabat marki
  else if (brandDiscountBp != null) {
    const discountMultiplier = (10000 - brandDiscountBp) / 10000;
    unitNet = Math.round(retailPriceNet * discountMultiplier);
  }

  const totalNet = unitNet * quantity;
  const totalVat = Math.round(totalNet * (vatRate / 100));
  const totalGross = totalNet + totalVat;

  return {
    unitNet,
    totalNet,
    totalVat,
    totalGross,
  };
}