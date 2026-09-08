import { z } from 'zod'

// Reuse the existing database enum values for PAID / PENDING.
export const EXPENSE_PAYMENT_STATUSES = ['paid', 'pending'] as const
export const PAYMENT_METHODS = [
  'cash', 'bank_transfer', 'card', 'bizum', 'direct_debit', 'cheque', 'other',
] as const

export const PAYMENT_METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  cash: 'Efectivo',
  bank_transfer: 'Transferencia bancaria',
  card: 'Tarjeta',
  bizum: 'Bizum',
  direct_debit: 'Domiciliación bancaria',
  cheque: 'Cheque',
  other: 'Otro',
}

export const paymentDateSchema = z.string().refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`)
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value
    && date <= new Date()
}, 'Introduce una fecha de pago válida que no sea futura')

export const markExpensePaidSchema = z.object({
  paidAt: paymentDateSchema,
  paymentMethod: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: 'Selecciona una forma de pago' }),
  }),
})

export function expensePaymentData(input: {
  status: 'paid' | 'pending'
  paidAt?: string | null
  paymentMethod?: (typeof PAYMENT_METHODS)[number] | null
  date: string
}) {
  return {
    status: input.status,
    paidAt: input.status === 'paid' ? new Date(input.paidAt ?? input.date) : null,
    paymentMethod: input.status === 'paid' ? input.paymentMethod ?? null : null,
  }
}
