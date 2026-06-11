import { z } from 'zod'

const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,}$/

const optionalString = (max: number) =>
  z
    .string()
    .max(max)
    .trim()
    .optional()
    .or(z.literal('').transform(() => undefined))

export const fiscalDataSchema = z.object({
  name: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(200)
    .trim()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  nif: z
    .string()
    .min(1, 'El NIF/CIF es obligatorio')
    .max(20)
    .trim()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  legalName: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(200)
    .trim()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  fiscalAddress: optionalString(200),
  fiscalCity: optionalString(100),
  fiscalPostal: optionalString(10),
  fiscalProvince: optionalString(100),
  country: z.string().length(2).default('ES'),
  iban: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v.replace(/\s/g, ''))
    .refine(
      (v) => v === '' || ibanRegex.test(v),
      'IBAN no válido (formato esperado: ES12 1234 5678 ...)',
    )
    .optional()
    .or(z.literal('').transform(() => undefined)),
  email: z
    .string()
    .email('Email no válido')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phone: optionalString(20),
  websiteUrl: z
    .string()
    .url('URL no válida')
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

export type FiscalDataInput = z.infer<typeof fiscalDataSchema>

export const createSeriesSchema = z.object({
  code: z
    .string()
    .min(1, 'El código es obligatorio')
    .max(5, 'Máximo 5 caracteres')
    .regex(/^[A-Z0-9]+$/, 'Solo letras mayúsculas y números')
    .trim(),
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100).trim(),
  nextNumber: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === 'string' ? parseInt(v, 10) : v))
    .pipe(z.number().int().positive('Debe ser un número positivo').max(99999)),
})

export const updateSeriesSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100).trim().optional(),
  nextNumber: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === 'string' ? parseInt(v, 10) : v))
    .pipe(z.number().int().positive().max(99999))
    .optional(),
})

export type CreateSeriesInput = z.infer<typeof createSeriesSchema>
export type UpdateSeriesInput = z.infer<typeof updateSeriesSchema>
