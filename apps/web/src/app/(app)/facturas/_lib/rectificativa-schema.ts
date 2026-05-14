import { z } from 'zod'

export const rectificativaLineSchema = z.object({
  description: z.string().min(1, 'La descripción es obligatoria').max(500),
  quantity: z.number().min(0.001, 'La cantidad debe ser mayor que 0'),
  unitPrice: z.number(),
  vatRate: z.number().min(0).max(100),
})

export const createRectificativaSchema = z.object({
  originalInvoiceId: z.string().uuid('ID de factura inválido'),
  type: z.enum(['R1', 'R2', 'R3', 'R4', 'R5'], {
    message: 'Tipo de rectificativa inválido',
  }),
  reason: z.string().min(1, 'El motivo es obligatorio').max(500),
  lines: z.array(rectificativaLineSchema).min(1, 'Al menos una línea es obligatoria'),
})

export type CreateRectificativaInput = z.infer<typeof createRectificativaSchema>
