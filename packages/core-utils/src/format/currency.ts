// Manual es-ES formatting to guarantee consistent output across Node/ICU versions.
// Intl.NumberFormat behaviour for es-ES varies between Node builds (thousands
// separator, narrow-no-break-space before €), which breaks deterministic tests.
const CURRENCY_SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' }

export function formatCurrency(amount: number, currency = 'EUR'): string {
  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount)
  const [intStr = '0', decStr = '00'] = abs.toFixed(2).split('.')
  const intFormatted = intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  return `${sign}${intFormatted},${decStr} ${symbol}`
}
