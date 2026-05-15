import { describe, it, expect, beforeEach } from 'vitest'
import { MockProvider } from './mock'
import { VerifactuValidationError } from '../errors'
import type { InvoiceData, InvoiceRecordData } from './types'

function makeInvoice(overrides: Partial<InvoiceData> = {}): InvoiceData {
  return {
    id: 'inv-001',
    tenantId: 'tenant-abc',
    tenantNif: 'B00000001',
    tenantName: 'Test Emisor S.L.',
    invoiceType: 'F1',
    fullNumber: 'F-2024-0001',
    issuedAt: new Date('2024-11-29T10:00:00.000Z'),
    dueAt: null,
    status: 'issued',
    subtotal: 100,
    vatAmount: 21,
    totalAmount: 121,
    notes: null,
    clientNif: 'B12345678',
    clientName: 'Acme SL',
    lines: [
      {
        description: 'Servicio de consultoria',
        quantity: 1,
        unitPrice: 100,
        vatRate: 21,
        subtotal: 100,
        vatAmount: 21,
        totalAmount: 121,
      },
    ],
    ...overrides,
  }
}

function makeRecord(overrides: Partial<InvoiceRecordData> = {}): InvoiceRecordData {
  return {
    id: 'rec-001',
    tenantId: 'tenant-abc',
    invoiceId: 'inv-001',
    type: 'Alta',
    hash: 'a'.repeat(64),
    previousHash: null,
    canonicalXml: '<xml/>',
    qrUrl: null,
    sentAt: new Date('2024-11-29T10:05:00.000Z'),
    aeatResponse: null,
    status: 'accepted',
    createdAt: new Date('2024-11-29T10:05:00.000Z'),
    ...overrides,
  }
}

describe('MockProvider', () => {
  let provider: MockProvider

  beforeEach(() => {
    provider = new MockProvider()
  })

  describe('submitInvoice', () => {
    it('returns success=true with recordId and csv', async () => {
      const invoice = makeInvoice()
      const result = await provider.submitInvoice(invoice)

      expect(result.success).toBe(true)
      expect(result.recordId).toBe('mock-inv-001')
      expect(result.csv).toBeDefined()
      expect(result.csv).toHaveLength(16)
    })

    it('generates a deterministic SHA-256 based CSV (16 chars uppercase hex)', async () => {
      const invoice = makeInvoice()
      const r1 = await provider.submitInvoice(invoice)
      const r2 = await provider.submitInvoice(invoice)

      expect(r1.csv).toBe(r2.csv)
      expect(r1.csv).toMatch(/^[0-9A-F]{16}$/)
    })

    it('includes previousHash when a record already exists for the same tenant+invoice', async () => {
      const invoice = makeInvoice()
      const first = await provider.submitInvoice(invoice)
      expect(first.previousHash).toBeNull()

      const second = await provider.submitInvoice(invoice)
      expect(second.previousHash).toBe(first.csv)
    })

    it('throws VerifactuValidationError when totalAmount is negative', async () => {
      const invoice = makeInvoice({ totalAmount: -10 })

      await expect(provider.submitInvoice(invoice)).rejects.toThrow(
        VerifactuValidationError,
      )
      await expect(provider.submitInvoice(invoice)).rejects.toThrow(
        'Importe negativo no permitido en RegistroFacturacionAlta',
      )
    })

    it('is not instantaneous (simulates latency)', async () => {
      const start = performance.now()
      await provider.submitInvoice(makeInvoice())
      const elapsed = performance.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(4)
    })
  })

  describe('cancelInvoice', () => {
    it('returns success=true with recordId', async () => {
      const invoice = makeInvoice()
      const result = await provider.cancelInvoice(invoice)

      expect(result.success).toBe(true)
      expect(result.recordId).toBe('mock-cancel-inv-001')
    })

    it('generates its own hash (csv)', async () => {
      const invoice = makeInvoice()
      const result = await provider.cancelInvoice(invoice)

      expect(result.csv).toBeDefined()
      expect(result.csv).toHaveLength(16)
      expect(result.csv).toMatch(/^[0-9A-F]{16}$/)
    })

    it('is not instantaneous (simulates latency)', async () => {
      const start = performance.now()
      await provider.cancelInvoice(makeInvoice())
      const elapsed = performance.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(4)
    })
  })

  describe('getRecordStatus', () => {
    it("returns 'SENT' for mock- prefixed recordIds", async () => {
      const status = await provider.getRecordStatus('mock-123')
      expect(status).toBe('SENT')
    })

    it("returns 'ERROR' for mock-error- prefixed recordIds", async () => {
      const status = await provider.getRecordStatus('mock-error-456')
      expect(status).toBe('ERROR')
    })

    it("returns 'PENDING' for unknown recordIds", async () => {
      const status = await provider.getRecordStatus('other-789')
      expect(status).toBe('PENDING')
    })

    it('is not instantaneous (simulates latency)', async () => {
      const start = performance.now()
      await provider.getRecordStatus('mock-123')
      const elapsed = performance.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(4)
    })
  })

  describe('generateValidationUrl', () => {
    it('returns a correctly formatted AEAT validation URL', () => {
      const record = makeRecord({ invoiceId: 'inv-001' })
      const url = provider.generateValidationUrl(record)

      expect(url).toMatch(
        /^https:\/\/prewww2\.aeat\.es\/wlpl\/TIKE-CONT\/ValidarQR\?/,
      )

      const parsed = new URL(url)
      expect(parsed.searchParams.get('nif')).toBe('B00000000')
      expect(parsed.searchParams.get('numserie')).toBe('inv-001')
      expect(parsed.searchParams.get('fecha')).toBe('20241129')
      expect(parsed.searchParams.get('importe')).toBe('0.00')
    })

    it('truncates invoiceId to 20 chars for numserie', () => {
      const longId = 'a'.repeat(50)
      const record = makeRecord({ invoiceId: longId })
      const url = provider.generateValidationUrl(record)

      const parsed = new URL(url)
      expect(parsed.searchParams.get('numserie')).toHaveLength(20)
    })
  })
})
