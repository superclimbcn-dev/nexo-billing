import { z } from 'zod'

const VAT_RATES = [0, 4, 10, 21] as const
type VatRate = (typeof VAT_RATES)[number]

const numericField = z
  .union([z.number(), z.string()])
  .transform((v) =>
    typeof v === 'string' ? parseFloat(v.replace(',', '.').replace(/\.(?=\d{3})/g, '')) : v,
  )

export const quoteLineSchema = z.object({
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

export const createQuoteSchema = z.object({
  clientId: z.string().uuid('Cliente inválido'),
  issuedAt: z.string().min(1, 'La fecha de emisión es obligatoria').transform((v) => new Date(v)),
  validUntil: z
    .string()
    .min(1, 'La fecha de validez es obligatoria')
    .transform((v) => new Date(v)),
  notes: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  lines: z.array(quoteLineSchema).min(1, 'El presupuesto debe tener al menos una línea'),
})

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>
export type QuoteLineInput = z.infer<typeof quoteLineSchema>
