import { z } from 'zod'

const numericField = z
  .union([z.number(), z.string()])
  .transform((v) =>
    typeof v === 'string' ? parseFloat(v.replace(',', '.').replace(/\.(?=\d{3})/g, '')) : v,
  )

export const FREQUENCY_OPTIONS = [
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'BIWEEKLY', label: 'Quincenal' },
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'BIMONTHLY', label: 'Bimestral' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'SEMIANNUAL', label: 'Semestral' },
  { value: 'ANNUAL', label: 'Anual' },
] as const

export type FrequencyValue = (typeof FREQUENCY_OPTIONS)[number]['value']

export const recurringLineSchema = z.object({
  description: z.string().min(1, 'La descripción es obligatoria').max(500).trim(),
  quantity: numericField.pipe(z.number().positive('La cantidad debe ser mayor que 0')),
  unitPrice: numericField.pipe(z.number().min(0, 'El precio no puede ser negativo')),
  taxRate: numericField.pipe(z.number().min(0).max(100)),
})

export const createContractSchema = z.object({
  clientId: z.string().uuid('Cliente inválido'),
  name: z.string().min(1, 'El nombre es obligatorio').max(255).trim(),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL'], {
    errorMap: () => ({ message: 'Frecuencia inválida' }),
  }),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria').transform((v) => new Date(v)),
  endDate: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? new Date(v) : null)),
  seriesCode: z.string().min(1, 'La serie es obligatoria'),
  notes: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  lines: z.array(recurringLineSchema).min(1, 'Debe haber al menos una línea'),
})

export type CreateContractInput = z.infer<typeof createContractSchema>
export type RecurringLineInput = z.infer<typeof recurringLineSchema>
