// Spanish fiscal identifiers:
//   CIF  (companies): letter + 7 digits + control → "A-1234567-X" or "A-12345678"
//   NIE  (foreigners): X/Y/Z + 7 digits + letter → "X-1234567-A"
//   DNI  (individuals): 8 digits + letter → no separator
export function formatNif(nif: string): string {
  const clean = nif.trim().toUpperCase().replace(/[\s\-]/g, '')

  // CIF: B12345678 → B-12345678  (first char letter, 7 digits, 1 alphanumeric)
  // NIE: X1234567A → X-1234567-A (first char X/Y/Z, 7 digits, 1 letter)
  if (/^[A-Z]\d{7}[A-Z0-9]$/.test(clean)) {
    const prefix = clean[0]!
    const middle = clean.slice(1, 8)
    const control = clean[8]!
    // NIE: control is always a letter; CIF control can be letter or digit
    if (/^[XYZ]/.test(prefix) && /^[A-Z]$/.test(control)) {
      return `${prefix}-${middle}-${control}`
    }
    return `${prefix}-${middle}${control}`
  }

  // DNI: 12345678A → returned as-is (no canonical separator in Spain)
  return clean
}
