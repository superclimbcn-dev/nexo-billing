import { createHash } from 'node:crypto'
import type { IVerifactuProvider } from './interface'
import type { InvoiceData, InvoiceRecordData, VerifactuResult } from './types'
import { VerifactuProviderError } from '../errors'

/**
 * Mock provider for development and tests.
 *
 * - Computes a deterministic SHA-256 hash.
 * - Returns a fake CSV code.
 * - Never calls external APIs.
 */
export class MockProvider implements IVerifactuProvider {
  readonly name = 'mock'

  async submitInvoice(invoice: InvoiceData): Promise<VerifactuResult> {
    const recordId = `mock-${invoice.id}`
    const csv = this.generateFakeCsv(invoice)

    // Simulate occasional failures for testing error paths
    if (invoice.totalAmount < 0) {
      return {
        success: false,
        recordId,
        error: 'Importe negativo no permitido en RegistroFacturacionAlta',
      }
    }

    return { success: true, recordId, csv }
  }

  async cancelInvoice(invoice: InvoiceData): Promise<VerifactuResult> {
    const recordId = `mock-cancel-${invoice.id}`
    return { success: true, recordId }
  }

  generateValidationUrl(record: InvoiceRecordData): string {
    const params = new URLSearchParams({
      nif: 'B00000000', // placeholder — real NIF comes from tenant config
      numserie: record.invoiceId.slice(0, 20),
      fecha: record.createdAt.toISOString().slice(0, 10).replace(/-/g, ''),
      importe: '0.00',
    })
    return `https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?${params.toString()}`
  }

  async getRecordStatus(recordId: string): Promise<'PENDING' | 'SENT' | 'ERROR'> {
    if (recordId.startsWith('mock-error-')) return 'ERROR'
    if (recordId.startsWith('mock-')) return 'SENT'
    return 'PENDING'
  }

  private generateFakeCsv(invoice: InvoiceData): string {
    const payload = `${invoice.tenantId}:${invoice.fullNumber}:${invoice.issuedAt.toISOString()}:${invoice.totalAmount}`
    return createHash('sha256').update(payload, 'utf8').digest('hex').slice(0, 16).toUpperCase()
  }
}
