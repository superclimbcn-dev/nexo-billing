// Formats Spanish (and international) phone numbers.
// "666123456"     → "+34 666 12 34 56"
// "+34666123456"  → "+34 666 12 34 56"
// "34666123456"   → "+34 666 12 34 56"
export function formatPhone(phone: string, defaultCountryCode = '34'): string {
  const clean = phone.trim().replace(/[\s\-().]/g, '')

  // Strip leading + to work with raw digits
  const raw = clean.startsWith('+') ? clean.slice(1) : clean

  // Spanish number: country code 34 + 9 digits
  const spanishWithCode = /^34(\d{9})$/
  const spanishMatch = spanishWithCode.exec(raw)
  if (spanishMatch) {
    const n = spanishMatch[1]!
    return `+34 ${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7)}`
  }

  // Bare 9-digit Spanish national number
  if (/^\d{9}$/.test(raw)) {
    return `+${defaultCountryCode} ${raw.slice(0, 3)} ${raw.slice(3, 5)} ${raw.slice(5, 7)} ${raw.slice(7)}`
  }

  // Return cleaned input with + if it had one
  return clean.startsWith('+') ? `+${raw}` : clean
}
