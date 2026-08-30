// Parses currency strings using either comma or dot as the decimal separator.
// "2.375,00 €" → 2375
// "1234.56"    → 1234.56
export function parseCurrency(value: string): number {
  const clean = value.replace(/[€$£\s]/g, '').trim()
  const separators = Array.from(clean.matchAll(/[.,]/g), (match) => match.index)

  if (separators.length === 0) {
    const parsed = Number(clean)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const lastSeparatorIndex = separators.at(-1)!
  const hasComma = clean.includes(',')
  const hasDot = clean.includes('.')
  const fractionalDigits = clean.length - lastSeparatorIndex - 1

  const decimalSeparatorIndex = hasComma && hasDot
    ? lastSeparatorIndex
    : separators.length > 1
      ? fractionalDigits <= 2
        ? lastSeparatorIndex
        : -1
      : fractionalDigits === 3
        ? -1
        : lastSeparatorIndex

  const normalized = decimalSeparatorIndex === -1
    ? clean.replace(/[.,]/g, '')
    : `${clean.slice(0, decimalSeparatorIndex).replace(/[.,]/g, '')}.${clean
        .slice(decimalSeparatorIndex + 1)
        .replace(/[.,]/g, '')}`

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}
