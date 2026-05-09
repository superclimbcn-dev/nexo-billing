import { z } from 'zod'

// ── Helpers ─────────────────────────────────────────────────────────────────

const nifRegex = /^[A-Z0-9]{9}$/i

function nifField(fieldName: string) {
  return z
    .string()
    .length(9, `${fieldName} debe tener exactamente 9 caracteres`)
    .regex(nifRegex, `${fieldName} formato inválido`)
}

// ── Encadenamiento (chain) — reusable ───────────────────────────────────────

export const EncadenamientoSchema = z.object({
  registroAnterior: z.object({
    idEmisorFactura: nifField('NIF emisor'),
    idFactura: z.object({
      serieFactura: z
        .string()
        .max(60, 'Serie de factura máximo 60 caracteres')
        .regex(/^[^\s]+$/, 'Serie no puede contener espacios'),
      numFactura: z
        .string()
        .max(60, 'Número de factura máximo 60 caracteres')
        .regex(/^[^\s]+$/, 'Número no puede contener espacios'),
    }),
    huella: z.string().min(1, 'Huella del registro anterior es obligatoria'),
  }),
})

// ── SistemaInformatico (software declaration) ───────────────────────────────

export const SistemaInformaticoSchema = z.object({
  nombreRazon: z.string().min(1).max(120),
  nif: nifField('NIF del fabricante'),
  nombreSistemaInformatico: z.literal('Nexo Billing'),
  idSistemaInformatico: z.string().max(2),
  version: z.string().max(50),
  numeroInstalacion: z.string().max(100),
  tipoUsoPosibleSoloVerifactu: z.literal('S'),
  tipoUsoPosibleMultiOT: z.literal('S'),
  indicadorMultiplesOT: z.enum(['S', 'N']),
})

// ── RegistroAlta (normal invoice) ───────────────────────────────────────────

const idFacturaSchema = z.object({
  serieFactura: z
    .string()
    .max(60, 'Serie de factura máximo 60 caracteres')
    .regex(/^[^\s]+$/, 'Serie no puede contener espacios'),
  numFactura: z
    .string()
    .max(60, 'Número de factura máximo 60 caracteres')
    .regex(/^[^\s]+$/, 'Número no puede contener espacios'),
  fechaExpedicionFactura: z.coerce.date(),
})

const idEmisorSchema = z.object({
  nif: nifField('NIF emisor'),
  nombreRazon: z.string().min(1).max(120),
})

const idReceptorSchema = z.object({
  nif: z.string().optional(),
  nombreRazon: z.string().optional(),
  idType: z.string().optional(),
  idExt: z.string().optional(),
  codigoPais: z.string().optional(),
})

const desgloseIVASchema = z.object({
  tipoImpositivo: z.number().min(0).max(100),
  baseImponible: z.number().min(0),
  cuotaRepercutida: z.number().min(0),
  tipoRecargoEquivalencia: z.number().min(0).optional(),
  cuotaRecargoEquivalencia: z.number().min(0).optional(),
})

const desgloseFacturaSchema = z.object({
  sujeta: z.enum(['SI', 'NO']),
  exenta: z
    .object({
      causaExencion: z.enum(['E1', 'E2', 'E3', 'E4', 'E5', 'E6']),
    })
    .optional(),
  noExenta: z
    .object({
      tipoNoExenta: z.enum(['S1', 'S2', 'S3']),
      desgloseIVA: z.array(desgloseIVASchema).min(1, 'Al menos un desglose de IVA es obligatorio'),
    })
    .optional(),
})

export const RegistroAltaSchema = z
  .object({
    idVersionFacturacion: z.literal('1.0'),
    idFactura: idFacturaSchema,
    idEmisorFactura: idEmisorSchema,
    idReceptor: idReceptorSchema.optional(),
    tipoFactura: z.enum(['F1', 'F2', 'F3', 'R1', 'R2', 'R3', 'R4', 'R5']),
    descripcionOperacion: z.string().min(1).max(500),
    datosInmueble: z
      .object({
        situacionInmueble: z.string().min(1),
        referenciaCatastral: z.string().optional(),
      })
      .optional(),
    importeTotal: z.number().min(0, 'Importe total no puede ser negativo'),
    importeTransmisionSujetoAIVA: z.number().optional(),
    baseImponibleACoste: z.number().optional(),
    desgloseFactura: z.array(desgloseFacturaSchema).min(1, 'Al menos un desglose es obligatorio'),
    fechaOperacion: z.coerce.date().optional(),
    cuotaTotal: z.number().min(0),
    encadenamiento: EncadenamientoSchema,
    huella: z.string().min(1, 'Huella SHA-256 es obligatoria'),
    tipoHuella: z.literal('01'),
    fechaHoraHusoGenRegistro: z.string().datetime({ offset: true }),
  })
  .refine(
    (data) => {
      // F2 (simplificada): receptor es opcional, pero si se incluye debe ser válido
      if (data.tipoFactura === 'F2') return true
      // F1 y rectificativas: receptor es obligatorio
      return data.idReceptor !== undefined
    },
    {
      message: 'El receptor es obligatorio para facturas completas (F1) y rectificativas (R1-R5)',
      path: ['idReceptor'],
    },
  )
  .refine(
    (data) => {
      // Fecha de operacion no puede ser futura
      if (!data.fechaOperacion) return true
      return data.fechaOperacion <= new Date()
    },
    {
      message: 'La fecha de operación no puede ser futura',
      path: ['fechaOperacion'],
    },
  )
  .refine(
    (data) => {
      // Fecha de expedicion no anterior a 2020
      const year = data.idFactura.fechaExpedicionFactura.getFullYear()
      return year >= 2020
    },
    {
      message: 'La fecha de expedición no puede ser anterior a 2020',
      path: ['idFactura', 'fechaExpedicionFactura'],
    },
  )

// ── RegistroAnulacion (cancellation) ────────────────────────────────────────

export const RegistroAnulacionSchema = z.object({
  idVersionFacturacion: z.literal('1.0'),
  idFactura: idFacturaSchema,
  idEmisorFactura: idEmisorSchema,
  huella: z.string().min(1, 'Huella SHA-256 es obligatoria'),
  tipoHuella: z.literal('01'),
  fechaHoraHusoGenRegistro: z.string().datetime({ offset: true }),
  encadenamiento: EncadenamientoSchema,
})
