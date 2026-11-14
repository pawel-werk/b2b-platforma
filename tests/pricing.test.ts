import { describe, it, expect } from 'vitest';
import { calculateItemPrice } from '../src/lib/pricing';

describe('Pricing Logic - B2B & Detal', () => {
  it('Brak rabatu: detal 6423 gr netto, VAT 23%, brutto 7900 gr', () => {
    const res = calculateItemPrice({ retailPriceNet: 6423, vatRate: 23, quantity: 1 });
    expect(res.totalNet).toBe(6423);
    expect(res.totalVat).toBe(1477); 
    expect(res.totalGross).toBe(7900);
  });

  it('Rabat 20%: netto 5138 gr, VAT 1182 gr, brutto 6320 gr', () => {
    const res = calculateItemPrice({ retailPriceNet: 6423, vatRate: 23, brandDiscountBp: 2000, quantity: 1 });
    expect(res.totalNet).toBe(5138); 
    expect(res.totalVat).toBe(1182);
    expect(res.totalGross).toBe(6320);
  });

  it('Rabat 5%: netto 6102 gr, VAT 1403 gr, brutto 7505 gr', () => {
    const res = calculateItemPrice({ retailPriceNet: 6423, vatRate: 23, brandDiscountBp: 500, quantity: 1 });
    expect(res.totalNet).toBe(6102);
    expect(res.totalVat).toBe(1403);
    expect(res.totalGross).toBe(7505);
  });
});