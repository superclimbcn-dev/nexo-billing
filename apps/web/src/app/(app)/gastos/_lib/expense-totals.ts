export const EXPENSE_VAT_RATES = [0, 4, 10, 21] as const

export type ExpenseVatRate = (typeof EXPENSE_VAT_RATES)[number]

export interface ExpenseTotals {
  subtotal: number
  vatAmount: number
  totalAmount: number
}

export function calculateExpenseTotals(
  totalAmount: number,
  vatRate: ExpenseVatRate,
): ExpenseTotals {
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error('El importe total debe ser mayor que 0')
  }

  const totalCents = Math.round(totalAmount * 100)
  const subtotalCents = Math.round((totalCents * 100) / (100 + vatRate))
  const vatCents = totalCents - subtotalCents

  return {
    subtotal: subtotalCents / 100,
    vatAmount: vatCents / 100,
    totalAmount: totalCents / 100,
  }
}
