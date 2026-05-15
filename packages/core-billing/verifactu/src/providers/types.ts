/**
 * Shared types for the Verifactu module.
 * All types are pure data structures — no runtime logic.
 */

export type VerifactuStatus = 'pending' | 'accepted' | 'rejected' | 'error'

export type VerifactuRecordType = 'Alta' | 'Anulacion' | 'Rectificacion'

export interface VerifactuResult {
  success: boolean
  recordId: string
  csv?: string
  qrUrl?: string
  error?: string
  previousHash?: string | null
}

export interface InvoiceData {
  id: string
  tenantId: string
  tenantNif: string
  tenantName: string
  invoiceType: string
  fullNumber: string
  issuedAt: Date
  dueAt: Date | null
  status: string
  subtotal: number
  vatAmount: number
  totalAmount: number
  notes: string | null
  clientNif: string
  clientName: string
  lines: Array<{
    description: string
    quantity: number
    unitPrice: number
    vatRate: number
    subtotal: number
    vatAmount: number
    totalAmount: number
  }>
}

export interface InvoiceRecordData {
  id: string
  tenantId: string
  invoiceId: string
  type: VerifactuRecordType
  hash: string
  previousHash: string | null
  canonicalXml: string
  qrUrl: string | null
  sentAt: Date | null
  aeatResponse: unknown
  status: VerifactuStatus
  createdAt: Date
}
