// Public API of the Verifactu module.
// Only these exports are considered stable and safe for external consumption.

export type { IVerifactuProvider } from './providers/interface'
export type { InvoiceData, InvoiceRecordData, VerifactuResult, VerifactuStatus, VerifactuRecordType } from './providers/types'
export { MockProvider } from './providers/mock'
export { MockProviderV2 } from './providers/mock-v2'
export { VerifactiProvider } from './providers/verifacti'
export type { VerifactiProviderOptions } from './providers/verifacti'
export { createProvider } from './providers/factory'
export type { ProviderName, FactoryOptions } from './providers/factory'

/**
 * Register a tenant NIF as an emitter in Verifacti.
 * No-op when VERIFACTU_PROVIDER is not 'verifacti'.
 * Safe to call from onboarding and fiscal data settings — never throws.
 */
export async function registerEmisorIfEnabled(nif: string, razonSocial: string): Promise<void> {
  if (process.env.VERIFACTU_PROVIDER !== 'verifacti') return
  try {
    const { createProvider } = await import('./providers/factory')
    const provider = createProvider()
    if (provider.name === 'verifacti') {
      const { VerifactiProvider } = await import('./providers/verifacti')
      if (provider instanceof VerifactiProvider) {
        await provider.registerEmisor(nif, razonSocial)
      }
    }
  } catch (err) {
    console.error('[verifactu] registerEmisorIfEnabled failed:', err instanceof Error ? err.message : err)
  }
}

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

// XML generation
export {
  generateRegistroAltaXml,
  generateRegistroAnulacionXml,
  wrapSoapEnvelope,
} from './xml/templates'

// QR generation
export {
  generateAEATQRUrl,
  generateAEATQRUrlFromInvoice,
} from './qr/aeat-qr'
export type { AEATQROptions } from './qr/aeat-qr'
