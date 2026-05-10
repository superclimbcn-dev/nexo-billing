import { describe, it, expect, beforeEach } from 'vitest'
import { MockProviderV2 } from './mock-v2'
import type { InvoiceData } from './types'

function makeInvoice(overrides: Partial<InvoiceData> = {}): InvoiceData {
  return {
    id: 'inv-001',
    tenantId: 'tenant-abc',
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

describe('MockProviderV2 — happy mode', () => {
  let provider: MockProviderV2

  beforeEach(() => {
    provider = new MockProviderV2('happy')
  })

  it('always returns success=true', async () => {
    const result = await provider.submitInvoice(makeInvoice())
    expect(result.success).toBe(true)
  })

  it('returns a 16-char uppercase CSV', async () => {
    const result = await provider.submitInvoice(makeInvoice())
    expect(result.csv).toBeDefined()
    expect(result.csv).toHaveLength(16)
    expect(result.csv).toMatch(/^[0-9A-F]{16}$/)
  })

  it('generates deterministic CSV for identical invoices', async () => {
    const invoice = makeInvoice()
    const r1 = await provider.submitInvoice(invoice)
    // Reset provider to test determinism without previous hash chaining
    const provider2 = new MockProviderV2('happy')
    const r2 = await provider2.submitInvoice(invoice)
    expect(r1.csv).toBe(r2.csv)
  })

  it('chains previousHash between submissions', async () => {
    const invoice1 = makeInvoice({ id: 'inv-1', fullNumber: 'F-001' })
    const invoice2 = makeInvoice({ id: 'inv-2', fullNumber: 'F-002' })

    const r1 = await provider.submitInvoice(invoice1)
    expect(r1.previousHash).toBeNull()

    const r2 = await provider.submitInvoice(invoice2)
    expect(r2.previousHash).toBeDefined()
  })

  it('cancelInvoice returns success=true', async () => {
    const result = await provider.cancelInvoice(makeInvoice())
    expect(result.success).toBe(true)
    expect(result.recordId).toMatch(/^REC-CANCEL-/)
  })

  it('getRecordStatus returns SENT for REC- ids', async () => {
    const status = await provider.getRecordStatus('REC-123')
    expect(status).toBe('SENT')
  })

  it('getRecordStatus returns ERROR for ERR- ids', async () => {
    const status = await provider.getRecordStatus('ERR-123')
    expect(status).toBe('ERROR')
  })
})

describe('MockProviderV2 — realistic mode', () => {
  it('may return errors over many calls', async () => {
    const provider = new MockProviderV2('realistic')
    const results = await Promise.all(
      Array.from({ length: 50 }, () => provider.submitInvoice(makeInvoice())),
    )

    const successes = results.filter((r) => r.success).length
    const failures = results.filter((r) => !r.success).length

    expect(successes).toBeGreaterThanOrEqual(30)
    expect(failures).toBeGreaterThanOrEqual(1)
    expect(failures).toBeLessThanOrEqual(20)
  })

  it('error messages include AEAT error codes', async () => {
    const provider = new MockProviderV2('realistic')

    // Force many calls to trigger at least one error
    let foundError = false
    for (let i = 0; i < 100; i++) {
      const result = await provider.submitInvoice(makeInvoice({ id: `inv-${i}` }))
      if (!result.success) {
        expect(result.error).toMatch(/\[AEAT_TIMEOUT\]|\[INVALID_HASH\]|\[CHAIN_BROKEN\]/)
        foundError = true
        break
      }
    }

    expect(foundError).toBe(true)
  })
})
