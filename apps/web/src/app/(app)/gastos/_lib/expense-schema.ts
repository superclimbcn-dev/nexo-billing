import { z } from 'zod'
import { parseCurrency } from '@nexo/core-utils'

export const EXPENSE_CATEGORIES = [
  'ALIMENTACION',
  'TRANSPORTE',
  'MATERIAL',
  'SERVICIOS',
  'OTROS',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const expenseSchema = z.object({
  amount: z
    .string()
    .transform((v) => parseCurrency(v))
    .pipe(z.number().min(0.01, 'El importe debe ser mayor que 0')),
  date: z.string().refine((val) => {
    const d = new Date(val)
    return !isNaN(d.getTime()) && d <= new Date()
  }, 'La fecha no puede ser futura'),
  category: z.enum(EXPENSE_CATEGORIES, {
    errorMap: () => ({ message: 'Categoría no válida' }),
  }),
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
})

export type ExpenseInput = z.infer<typeof expenseSchema>
