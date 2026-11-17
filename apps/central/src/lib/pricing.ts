export function calculateB2BPrice({
  retailPriceNet,
  vatRate,
  netNetPrice,
  customPriceNet,
  discountPb
}: {
  retailPriceNet: number;
  vatRate: number;
  netNetPrice: number | null;
  customPriceNet: number | null;
  discountPb: number;
}) {
  let finalNet = retailPriceNet;
  let priceSource: "individual" | "net_net" | "retail_discounted" | "retail" = "retail";

  if (customPriceNet !== null) {
    finalNet = customPriceNet;
    priceSource = "individual";
  } else if (netNetPrice !== null) {
    finalNet = netNetPrice;
    priceSource = "net_net";
  } else if (discountPb > 0) {
    finalNet = Math.round(retailPriceNet * (1 - discountPb / 10000));
    priceSource = "retail_discounted";
  }

  const finalGross = Math.round(finalNet * (1 + vatRate / 100));
  const retailGross = Math.round(retailPriceNet * (1 + vatRate / 100));

  return { finalNet, finalGross, retailGross, priceSource };
}
