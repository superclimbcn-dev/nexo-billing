import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createInvoiceSchema, createSimplifiedInvoiceSchema } from './invoice-schema'

const baseSimplifiedInvoice = {
  issuedAt: '2026-08-29',
  operationAt: '2026-08-28',
  description: 'Servicio de limpieza',
  totalVatIncluded: 120,
  vatRate: 21,
  paymentMethod: 'card',
  paymentReference: 'TPV-123',
  consumerHomeService: false,
}

describe('createSimplifiedInvoiceSchema', () => {
  it('accepts an anonymous F2 without a client', () => {
    const parsed = createSimplifiedInvoiceSchema.safeParse(baseSimplifiedInvoice)
    assert.equal(parsed.success, true)
  })

  it('accepts an operation date before the issue date', () => {
    const parsed = createSimplifiedInvoiceSchema.safeParse(baseSimplifiedInvoice)
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.operationAt.toISOString().slice(0, 10), '2026-08-28')
    }
  })

  it('rejects a normal simplified invoice above 400 euros even when paid by card', () => {
    const parsed = createSimplifiedInvoiceSchema.safeParse({
      ...baseSimplifiedInvoice,
      totalVatIncluded: 400.01,
      paymentMethod: 'card',
    })
    assert.equal(parsed.success, false)
  })

  it('allows a home service above 400 and up to 3000 euros', () => {
    const parsed = createSimplifiedInvoiceSchema.safeParse({
      ...baseSimplifiedInvoice,
      totalVatIncluded: 2500,
      consumerHomeService: true,
    })
    assert.equal(parsed.success, true)
  })

  it('rejects a home service above 3000 euros', () => {
    const parsed = createSimplifiedInvoiceSchema.safeParse({
      ...baseSimplifiedInvoice,
      totalVatIncluded: 3000.01,
      consumerHomeService: true,
    })
    assert.equal(parsed.success, false)
  })
})

describe('createInvoiceSchema', () => {
  it('continues requiring a client for complete invoices', () => {
    const parsed = createInvoiceSchema.safeParse({
      seriesId: '2a1eeb10-3306-4658-a611-9e4eb36c8d77',
      issuedAt: '2026-08-29',
      dueAt: null,
      lines: [{ description: 'Servicio', quantity: 1, unitPrice: 100, vatRate: 21 }],
    })
    assert.equal(parsed.success, false)
  })
})
