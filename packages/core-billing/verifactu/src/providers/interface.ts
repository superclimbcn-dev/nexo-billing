import type { InvoiceData, InvoiceRecordData, VerifactuResult } from './types'

/**
 * Contract that every Verifactu provider must implement.
 *
 * Providers abstract the submission mechanism:
 * - MockProvider: for development and tests
 * - VerifactiProvider: production via Verifacti intermediary (V1)
 * - AeatNativeProvider: direct AEAT integration (future)
 */
export interface IVerifactuProvider {
  readonly name: string

  /**
   * Submit an invoice to AEAT (RegistroFacturacionAlta).
   *
   * @param invoice — validated invoice data
   * @returns result with recordId, CSV (verification code), and optional error
   */
  submitInvoice(invoice: InvoiceData): Promise<VerifactuResult>

  /**
   * Cancel an already-submitted invoice (RegistroFacturacionAnulacion).
   *
   * @param invoice — the invoice to cancel
   * @returns result with recordId and optional error
   */
  cancelInvoice(invoice: InvoiceData): Promise<VerifactuResult>

  /**
   * Generate the AEAT validation URL for a QR code.
   *
   * Format:
   * https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR
   *   ?nif={NIF}&numserie={SERIE}&fecha={FECHA}&importe={IMPORTE}
   *
   * @param record — the submitted invoice record
   * @returns full URL string
   */
  generateValidationUrl(record: InvoiceRecordData): string

  /**
   * Check the submission status of a record.
   *
   * @param recordId — the invoice record UUID
   * @returns current status of the record
   */
  getRecordStatus(recordId: string): Promise<'PENDING' | 'SENT' | 'ERROR'>
}
