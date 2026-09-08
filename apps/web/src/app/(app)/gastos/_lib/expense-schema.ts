import { z } from 'zod'
import { parseCurrency } from '@nexo/core-utils'
import { EXPENSE_VAT_RATES } from './expense-totals'
import { EXPENSE_PAYMENT_STATUSES, PAYMENT_METHODS, paymentDateSchema } from './expense-payment'

export const EXPENSE_CATEGORIES = [
  'ALIMENTACION',
  'TRANSPORTE',
  'MATERIAL',
  'SERVICIOS',
  'OTROS',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

const deductiblePercentSchema = z
  .number()
  .finite()
  .min(0, 'El porcentaje no puede ser negativo')
  .max(100, 'El porcentaje no puede superar 100')
  .nullish()
  .transform((value) => value ?? null)

export const expenseSchema = z.object({
  status: z.enum(EXPENSE_PAYMENT_STATUSES).default('paid'),
  paidAt: paymentDateSchema.nullish(),
  paymentMethod: z.enum(PAYMENT_METHODS).nullish(),
  amount: z
    .string()
    .transform((v) => parseCurrency(v))
    .pipe(
      z
        .number()
        .finite('El importe debe ser un número válido')
        .min(0.01, 'El importe debe ser mayor que 0'),
    ),
  date: z.string().refine((val) => {
    const d = new Date(val)
    return !isNaN(d.getTime()) && d <= new Date()
  }, 'La fecha no puede ser futura'),
  category: z.enum(EXPENSE_CATEGORIES, {
    errorMap: () => ({ message: 'Categoría no válida' }),
  }),
  vatRate: z
    .number()
    .finite()
    .refine((value) => (EXPENSE_VAT_RATES as readonly number[]).includes(value), {
      message: 'IVA debe ser 0%, 4%, 10% o 21%',
    })
    .nullable(),
  vatDeductiblePercent: deductiblePercentSchema,
  irpfDeductiblePercent: deductiblePercentSchema,
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  vendor: z
    .string()
    .max(200, 'El proveedor no puede exceder 200 caracteres')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  externalNumber: z
    .string()
    .trim()
    .max(100, 'El número no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

export type ExpenseInput = z.infer<typeof expenseSchema>
