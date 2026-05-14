import { createHash } from 'node:crypto'
import type { IVerifactuProvider } from './interface'
import type { InvoiceData, InvoiceRecordData, VerifactuResult } from './types'
import { computeRecordHash } from '../crypto/hash'

export type MockMode = 'happy' | 'realistic'

interface SimulatedError {
  code: string
  message: string
}

const REALISTIC_ERRORS: SimulatedError[] = [
  {
    code: 'AEAT_TIMEOUT',
    message: 'La AEAT no responde. Reintentar en 60s.',
  },
  {
    code: 'INVALID_HASH',
    message: 'La huella hash no es valida.',
  },
  {
    code: 'CHAIN_BROKEN',
    message: 'Error en encadenamiento. Contactar soporte.',
  },
]

/**
 * Advanced mock provider for development and tests.
 *
 * - 'happy' mode: always succeeds (useful for demos and happy-path tests)
 * - 'realistic' mode: simulates real-world failures (80% success, 20% errors)
 */
export class MockProviderV2 implements IVerifactuProvider {
  readonly name = 'mock-v2'

  private previousHashes = new Map<string, string>()

  constructor(private readonly mode: MockMode = 'realistic') {}

  async submitInvoice(invoice: InvoiceData): Promise<VerifactuResult> {
    await this.simulateLatency()

    if (this.mode === 'realistic' && Math.random() < 0.2) {
      const error = REALISTIC_ERRORS[Math.floor(Math.random() * REALISTIC_ERRORS.length)]!
      return {
        success: false,
        recordId: `ERR-${Date.now()}`,
        error: `[${error.code}] ${error.message}`,
      }
    }

    const previousHash = this.previousHashes.get(invoice.tenantId) ?? null
    const hash = computeRecordHash(invoice, previousHash)
    const csv = hash.substring(0, 16).toUpperCase()
    const recordId = `REC-${Date.now()}`

    this.previousHashes.set(invoice.tenantId, hash)

    return {
      success: true,
      recordId,
      csv,
      previousHash,
    }
  }

  async cancelInvoice(invoice: InvoiceData): Promise<VerifactuResult> {
    await this.simulateLatency()

    if (this.mode === 'realistic' && Math.random() < 0.2) {
      const error = REALISTIC_ERRORS[Math.floor(Math.random() * REALISTIC_ERRORS.length)]!
      return {
        success: false,
        recordId: `ERR-CANCEL-${Date.now()}`,
        error: `[${error.code}] ${error.message}`,
      }
    }

    const previousHash = this.previousHashes.get(invoice.tenantId) ?? null
    const hash = computeRecordHash(
      { ...invoice, operation: 'cancel' },
      previousHash,
    )
    const csv = hash.substring(0, 16).toUpperCase()
    const recordId = `REC-CANCEL-${Date.now()}`

    this.previousHashes.set(invoice.tenantId, hash)

    return {
      success: true,
      recordId,
      csv,
      previousHash,
    }
  }

  generateValidationUrl(record: InvoiceRecordData): string {
    const params = new URLSearchParams({
      nif: 'B00000000',
      numserie: record.invoiceId.slice(0, 20),
      fecha: record.createdAt.toISOString().slice(0, 10).replace(/-/g, ''),
      importe: '0.00',
    })
    return `https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?${params.toString()}`
  }

  async getRecordStatus(
    recordId: string,
  ): Promise<'PENDING' | 'SENT' | 'ERROR'> {
    await this.simulateLatency()

    if (recordId.startsWith('ERR-')) return 'ERROR'
    if (recordId.startsWith('REC-')) return 'SENT'
    return 'PENDING'
  }

  private simulateLatency(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 5))
  }
}
