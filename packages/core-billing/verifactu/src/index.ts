// Public API of the Verifactu module.
// Only these exports are considered stable and safe for external consumption.

export type { IVerifactuProvider } from './providers/interface'
export type { InvoiceData, InvoiceRecordData, VerifactuResult, VerifactuStatus, VerifactuRecordType } from './providers/types'
export { MockProvider } from './providers/mock'

export {
  VerifactuError,
  VerifactuValidationError,
  VerifactuChainBrokenError,
  VerifactuProviderError,
  VerifactuAEATRejectionError,
  VerifactuTimeoutError,
} from './errors'

// AEAT record schemas and types
export {
  RegistroAltaSchema,
  RegistroAnulacionSchema,
  EncadenamientoSchema,
  SistemaInformaticoSchema,
} from './records/schemas'

export type {
  RegistroAlta,
  RegistroAnulacion,
  Encadenamiento,
  SistemaInformatico,
} from './records/types'

// Hash and chain
export { computeRecordHash } from './crypto/hash'
export { ChainService } from './chain/chain-service'
export type { IRecordRepository } from './chain/chain-service'
