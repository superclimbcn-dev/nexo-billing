// Groups the cleaned IBAN into blocks of 4 characters separated by spaces.
// "ES1234567890123456789012" → "ES12 3456 7890 1234 5678 9012"
export function formatIban(iban: string): string {
  const clean = iban.trim().toUpperCase().replace(/\s/g, '')
  return clean.match(/.{1,4}/g)?.join(' ') ?? clean
}
