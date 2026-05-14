// Parses a Spanish-formatted number string into a plain number.
// "15,50"    → 15.5
// "1.234,56" → 1234.56
export function parseNumber(value: string): number {
  const clean = value.trim()
  // Spanish format: dot as thousands separator, comma as decimal
  const normalized = clean.replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? 0 : parsed
}
