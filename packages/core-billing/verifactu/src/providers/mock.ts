import { createHash } from 'node:crypto'
import type { IVerifactuProvider } from './interface'
import type { InvoiceData, InvoiceRecordData, VerifactuResult } from './types'
import { VerifactuValidationError } from '../errors'

/**
 * Mock provider for development and tests.
 *
 * - Computes a deterministic SHA-256 hash.
 * - Returns a fake CSV code.
 * - Never calls external APIs.
 * - Simulates latency (non-zero async work).
 * - Maintains internal state for hash chaining (previousHash).
 */
export class MockProvider implements IVerifactuProvider {
  readonly name = 'mock'
  private records = new Map<string, VerifactuResult>()

  async submitInvoice(invoice: InvoiceData): Promise<VerifactuResult> {
    await this.simulateLatency()

    if (invoice.totalAmount < 0) {
      throw new VerifactuValidationError(
        'Importe negativo no permitido en RegistroFacturacionAlta',
        ['totalAmount'],
      )
    }

    const recordId = `mock-${invoice.id}`
    const csv = this.generateFakeCsv(invoice)

    const key = `${invoice.tenantId}:${invoice.fullNumber}`
    const previous = this.records.get(key)

    const result: VerifactuResult = {
      success: true,
      recordId,
      csv,
      previousHash: previous?.csv ?? null,
    }

    this.records.set(key, result)
    return result
  }

  async cancelInvoice(invoice: InvoiceData): Promise<VerifactuResult> {
    await this.simulateLatency()

    const recordId = `mock-cancel-${invoice.id}`
    const csv = this.generateFakeCsv(invoice)

    return { success: true, recordId, csv }
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

  async getRecordStatus(
    recordId: string,
  ): Promise<'PENDING' | 'SENT' | 'ERROR'> {
    await this.simulateLatency()

    if (recordId.startsWith('mock-error-')) return 'ERROR'
    if (recordId.startsWith('mock-')) return 'SENT'
    return 'PENDING'
  }

  private generateFakeCsv(invoice: InvoiceData): string {
    const payload = `${invoice.tenantId}:${invoice.fullNumber}:${invoice.issuedAt.toISOString()}:${invoice.totalAmount}`
    return createHash('sha256')
      .update(payload, 'utf8')
      .digest('hex')
      .slice(0, 16)
      .toUpperCase()
  }

  private simulateLatency(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 5))
  }
}
