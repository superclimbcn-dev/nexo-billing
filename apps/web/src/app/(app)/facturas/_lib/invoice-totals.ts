export interface LineForCalculation {
  quantity: number
  unitPrice: number
  vatRate: number
}

export interface VatBreakdownEntry {
  rate: number
  base: number
  amount: number
}

export interface InvoiceTotals {
  subtotal: number
  vatBreakdown: VatBreakdownEntry[]
  vatTotal: number
  total: number
}

export function calculateInvoiceTotals(lines: LineForCalculation[]): InvoiceTotals {
  const subtotalsByRate = new Map<number, number>()
  let subtotal = 0

  for (const line of lines) {
    const lineSubtotal = line.quantity * line.unitPrice
    subtotal += lineSubtotal
    subtotalsByRate.set(line.vatRate, (subtotalsByRate.get(line.vatRate) ?? 0) + lineSubtotal)
  }

  const vatBreakdown: VatBreakdownEntry[] = Array.from(subtotalsByRate.entries())
    .map(([rate, base]) => ({
      rate,
      base: roundCents(base),
      amount: roundCents(base * (rate / 100)),
    }))
    .sort((a, b) => a.rate - b.rate)

  const vatTotal = vatBreakdown.reduce((sum, entry) => sum + entry.amount, 0)

  return {
    subtotal: roundCents(subtotal),
    vatBreakdown,
    vatTotal: roundCents(vatTotal),
    total: roundCents(subtotal + vatTotal),
  }
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100
}
