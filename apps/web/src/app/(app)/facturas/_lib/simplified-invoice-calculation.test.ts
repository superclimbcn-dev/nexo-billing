import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calculateSimplifiedInvoiceAmounts } from './simplified-invoice-calculation'

describe('calculateSimplifiedInvoiceAmounts', () => {
  it('derives base and VAT from a VAT-inclusive total using half-up rounding', () => {
    const amounts = calculateSimplifiedInvoiceAmounts('120.00', '21')

    assert.equal(amounts.subtotal.toFixed(2), '99.17')
    assert.equal(amounts.vatAmount.toFixed(2), '20.83')
    assert.equal(amounts.totalAmount.toFixed(2), '120.00')
  })

  it('keeps the full total as base for zero-rated VAT', () => {
    const amounts = calculateSimplifiedInvoiceAmounts('120.00', '0')

    assert.equal(amounts.subtotal.toFixed(2), '120.00')
    assert.equal(amounts.vatAmount.toFixed(2), '0.00')
  })
})
