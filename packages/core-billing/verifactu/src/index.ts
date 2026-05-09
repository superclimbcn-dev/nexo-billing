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
