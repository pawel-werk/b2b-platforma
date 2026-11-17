export interface PricingParams {
  individualPriceNet: number | null;
  productNetNet: number | null;
  retailPriceNet: number;
  brandDiscountPb: number;
  vatRate: number;
}

export function calculateB2BPrice({
  individualPriceNet,
  productNetNet,
  retailPriceNet,
  brandDiscountPb,
  vatRate
}: PricingParams) {
  let finalNet = retailPriceNet;

  // 1. Cena indywidualna (najwyższy priorytet)
  if (individualPriceNet !== null) {
    finalNet = individualPriceNet;
  } 
  // 2. Cena net/net (drugi priorytet)
  else if (productNetNet !== null) {
    finalNet = productNetNet;
  } 
  // 3. Cena detaliczna minus rabat w punktach bazowych (np. 2000 pb = 20%)
  else {
    const multiplier = (10000 - brandDiscountPb) / 10000;
    finalNet = Math.round(retailPriceNet * multiplier);
  }

  const vatAmount = Math.round(finalNet * (vatRate / 100));
  const totalGross = finalNet + vatAmount;

  return { finalNet, vatAmount, totalGross };
}