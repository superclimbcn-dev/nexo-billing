import type { z } from 'zod'
import type {
  RegistroAltaSchema,
  RegistroAnulacionSchema,
  EncadenamientoSchema,
  SistemaInformaticoSchema,
} from './schemas'

export type RegistroAlta = z.infer<typeof RegistroAltaSchema>
export type RegistroAnulacion = z.infer<typeof RegistroAnulacionSchema>
export type Encadenamiento = z.infer<typeof EncadenamientoSchema>
export type SistemaInformatico = z.infer<typeof SistemaInformaticoSchema>
