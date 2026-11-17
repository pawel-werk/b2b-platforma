import { expect, test } from 'vitest';
import { calculateB2BPrice } from './pricing';

test('applies individual price as highest priority', () => {
  const result = calculateB2BPrice({
    individualPriceNet: 50000, // 500.00 zł
    productNetNet: 60000,
    retailPriceNet: 100000,
    brandDiscountPb: 2000, // 20%
    vatRate: 23
  });
  expect(result.finalNet).toBe(50000);
  expect(result.totalGross).toBe(61500); // 500.00 + 23%
});

test('applies net/net price if no individual price', () => {
  const result = calculateB2BPrice({
    individualPriceNet: null,
    productNetNet: 60000,
    retailPriceNet: 100000,
    brandDiscountPb: 2000,
    vatRate: 8
  });
  expect(result.finalNet).toBe(60000);
  expect(result.totalGross).toBe(64800); // 600.00 + 8%
});

test('applies basis points discount correctly', () => {
  const result = calculateB2BPrice({
    individualPriceNet: null,
    productNetNet: null,
    retailPriceNet: 100000, // 1000.00 zł
    brandDiscountPb: 1250,  // 12.5%
    vatRate: 23
  });
  // 100000 * 0.875 = 87500
  expect(result.finalNet).toBe(87500);
});