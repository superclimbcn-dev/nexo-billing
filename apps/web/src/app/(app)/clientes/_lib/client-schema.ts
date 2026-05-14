import { z } from 'zod'

// Accepts NIF (8 digits + letter), CIF (letter + 8 alphanumeric), NIE (X/Y/Z + 7 digits + letter).
// Does not validate the control character — server-side only if needed.
const NIF_REGEX = /^([A-Z]\d{7}[A-Z0-9]|\d{8}[A-Z]|[XYZ]\d{7}[A-Z])$/i

export const clientSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .trim(),
  legalName: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  nif: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => NIF_REGEX.test(v.replace(/[\s-]/g, '')), {
      message: 'NIF/CIF/NIE no válido (ej: B12345678, 12345678Z, X1234567L)',
    })
    .transform((v) => v.replace(/[\s-]/g, '')),
  email: z
    .string()
    .trim()
    .email('Email no válido')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phone: z
    .string()
    .trim()
    .max(20, 'Teléfono demasiado largo')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  contactPerson: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  address: z
    .string()
    .trim()
    .max(255)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  city: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'Código postal: 5 dígitos')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  province: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

export type ClientInput = z.infer<typeof clientSchema>
