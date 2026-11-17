const plnFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formatuje kwotę podaną w groszach (z API) do formatu "1 369,00 zł".
 * Sklep nigdy nie przelicza cen sam — wyłącznie formatuje wartości z API.
 */
export function formatGrosze(grosze: number): string {
  return plnFormatter.format((grosze || 0) / 100);
}
