import { z } from "zod";

export const isValidNIP = (nip: string) => {
  const str = nip.replace(/[\s-]/g, '');
  if (str.length !== 10 || !/^\d{10}$/.test(str)) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(str[i]) * weights[i];
  return (sum % 11) === parseInt(str[9]);
};

export const rejectCompanySchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(5, "Podaj sensowny powód odrzucenia"),
});

export const conditionsSchema = z.object({
  companyId: z.string().uuid(),
  paymentTerm: z.enum(["prepayment", "7_days", "14_days", "21_days", "30_days", "45_days", "60_days"]),
  creditLimit: z.number().nullable(), // W GROSZACH (pod maską)
  discounts: z.record(z.string(), z.number().min(0).max(10000)), // Marka ID -> pb (punkty bazowe)
  customPrices: z.array(z.object({
    productId: z.string().uuid(),
    priceNet: z.number().min(0) // W GROSZACH
  }))
});
