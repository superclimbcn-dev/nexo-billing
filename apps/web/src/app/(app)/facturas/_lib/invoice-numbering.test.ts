import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatInvoiceNumber, reserveInvoiceNumber } from './invoice-numbering'

describe('invoice numbering', () => {
  it('keeps the FS series independent from the complete invoice series', () => {
    const issuedAt = new Date('2026-08-29T12:00:00Z')

    assert.equal(formatInvoiceNumber('A', '0000', issuedAt, 1), 'A-2026-0001')
    assert.equal(formatInvoiceNumber('FS', '0000', issuedAt, 1), 'FS-2026-0001')
  })

  it('uses the post-increment value to reserve unique concurrent numbers', async () => {
    let nextNumber = 1
    const incrementCounter = async () => {
      await Promise.resolve()
      nextNumber += 1
      return { code: 'FS', numberFormat: '0000', nextNumber }
    }

    const issuedAt = new Date('2026-08-29T12:00:00Z')
    const reservations = await Promise.all([
      reserveInvoiceNumber(incrementCounter, issuedAt),
      reserveInvoiceNumber(incrementCounter, issuedAt),
    ])

    assert.deepEqual(
      reservations.map((reservation) => reservation.number).sort((a, b) => a - b),
      [1, 2],
    )
    assert.equal(new Set(reservations.map((reservation) => reservation.fullNumber)).size, 2)
  })
})
