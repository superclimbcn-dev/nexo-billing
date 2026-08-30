import { z } from 'zod'

const VAT_RATES = [0, 4, 10, 21] as const
type VatRate = (typeof VAT_RATES)[number]

const PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
  'card',
  'bizum',
  'direct_debit',
  'cheque',
  'other',
] as const

const numericField = z
  .union([z.number(), z.string()])
  .transform((v) =>
    typeof v === 'string' ? parseFloat(v.replace(',', '.').replace(/\.(?=\d{3})/g, '')) : v,
  )

export const invoiceLineSchema = z.object({
  itemId: z.string().uuid().optional().nullable(),
  description: z
    .string()
    .min(1, 'La descripción es obligatoria')
    .max(500, 'Máximo 500 caracteres')
    .trim(),
  quantity: numericField.pipe(
    z.number().positive('La cantidad debe ser mayor que 0').max(99999, 'Cantidad demasiado alta'),
  ),
  unitPrice: numericField.pipe(
    z.number().min(0, 'El precio no puede ser negativo').max(99999999, 'Precio demasiado alto'),
  ),
  vatRate: numericField.pipe(
    z.number().refine((v): v is VatRate => (VAT_RATES as readonly number[]).includes(v), {
      message: 'IVA debe ser 0%, 4%, 10% o 21%',
    }),
  ),
})

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid('Cliente inválido'),
  seriesId: z.string().uuid('Serie inválida'),
  issuedAt: z.string().min(1, 'La fecha de emisión es obligatoria').transform((v) => new Date(v)),
  dueAt: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? new Date(v) : null)),
  notes: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  lines: z.array(invoiceLineSchema).min(1, 'La factura debe tener al menos una línea'),
})

export const createSimplifiedInvoiceSchema = z
  .object({
    issuedAt: z
      .string()
      .min(1, 'La fecha de expedición es obligatoria')
      .transform((value) => new Date(value)),
    operationAt: z
      .string()
      .min(1, 'La fecha de operación es obligatoria')
      .transform((value) => new Date(value)),
    description: z
      .string()
      .min(1, 'La descripción es obligatoria')
      .max(500, 'Máximo 500 caracteres')
      .trim(),
    totalVatIncluded: numericField.pipe(
      z.number().positive('El total debe ser mayor que 0').max(3000, 'El total no puede superar 3.000 €'),
    ),
    vatRate: numericField.pipe(
      z.number().refine((value): value is VatRate => (VAT_RATES as readonly number[]).includes(value), {
        message: 'IVA debe ser 0%, 4%, 10% o 21%',
      }),
    ),
    paymentMethod: z.enum(PAYMENT_METHODS),
    paymentReference: z
      .string()
      .trim()
      .max(120, 'Máximo 120 caracteres')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    consumerHomeService: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (Number.isNaN(data.issuedAt.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['issuedAt'], message: 'Fecha de expedición inválida' })
    }
    if (Number.isNaN(data.operationAt.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['operationAt'], message: 'Fecha de operación inválida' })
    }
    if (
      !Number.isNaN(data.issuedAt.getTime()) &&
      !Number.isNaN(data.operationAt.getTime()) &&
      data.operationAt > data.issuedAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['operationAt'],
        message: 'La fecha de operación no puede ser posterior a la expedición',
      })
    }

    const maximum = data.consumerHomeService ? 3000 : 400
    if (data.totalVatIncluded > maximum) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['totalVatIncluded'],
        message: data.consumerHomeService
          ? 'El total no puede superar 3.000 €'
          : 'La factura simplificada general no puede superar 400 €',
      })
    }
  })

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type CreateSimplifiedInvoiceInput = z.infer<typeof createSimplifiedInvoiceSchema>
export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>
