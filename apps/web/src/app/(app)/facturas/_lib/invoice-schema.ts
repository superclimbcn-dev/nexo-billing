import { z } from 'zod'

const VAT_RATES = [0, 4, 10, 21] as const
type VatRate = (typeof VAT_RATES)[number]

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

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>
