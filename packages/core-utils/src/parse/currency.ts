// Parses a Spanish-formatted currency string into a plain number.
// "2.375,00 €" → 2375
// "1.234,56 €" → 1234.56
export function parseCurrency(value: string): number {
  // Remove currency symbols and surrounding whitespace
  const withoutSymbol = value.replace(/[€$£\s]/g, '').trim()
  // Spanish format: dot as thousands separator, comma as decimal
  const normalized = withoutSymbol.replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? 0 : parsed
}
