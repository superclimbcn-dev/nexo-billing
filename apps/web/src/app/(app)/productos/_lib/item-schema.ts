import { z } from 'zod'
import { parseCurrency } from '@nexo/core-utils'

export const VAT_OPTIONS = ['0', '4', '10', '21'] as const
export type VatOption = (typeof VAT_OPTIONS)[number]

export const itemSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .trim(),
  description: z
    .string()
    .trim()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  type: z.enum(['product', 'service'], {
    errorMap: () => ({ message: 'Selecciona un tipo válido' }),
  }),
  unitPrice: z
    .string()
    .transform((v) => parseCurrency(v))
    .pipe(
      z
        .number()
        .min(0, 'El precio no puede ser negativo')
        .max(99999999, 'El precio es demasiado alto'),
    ),
  vatRate: z
    .enum(VAT_OPTIONS, {
      errorMap: () => ({ message: 'IVA no válido (0%, 4%, 10% o 21%)' }),
    })
    .transform((v) => parseFloat(v)),
  unit: z
    .string()
    .trim()
    .max(20, 'La unidad no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

export type ItemInput = z.infer<typeof itemSchema>
