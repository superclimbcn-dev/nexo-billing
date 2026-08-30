import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { expenseSchema } from './expense-schema'
import { calculateExpenseTotals } from './expense-totals'

const requiredAmounts = [
  ['20', 20],
  ['20,00', 20],
  ['20.00', 20],
  ['2.000,00', 2000],
  ['1.234,56', 1234.56],
  ['1234,56', 1234.56],
  ['1234.56', 1234.56],
] as const

describe('expenseSchema monetary parsing', () => {
  for (const [amount, expected] of requiredAmounts) {
    it(`normalizes ${amount} to ${expected}`, () => {
      const parsed = expenseSchema.parse({
        amount,
        date: '2026-01-01',
        category: 'OTROS',
        vatRate: 21,
        vatDeductiblePercent: 50,
        irpfDeductiblePercent: null,
      })

      assert.equal(parsed.amount, expected)
    })
  }

  it('calculates a 20 euro expense at 21% without multiplying the persisted amount', () => {
    const parsed = expenseSchema.parse({
      amount: '20,00',
      date: '2026-01-01',
      category: 'OTROS',
      vatRate: 21,
      vatDeductiblePercent: 50,
      irpfDeductiblePercent: null,
    })
    const totals = calculateExpenseTotals(parsed.amount, 21)

    assert.deepEqual(totals, {
      subtotal: 16.53,
      vatAmount: 3.47,
      totalAmount: 20,
    })
    assert.equal(Math.round(totals.vatAmount * 0.5 * 100) / 100, 1.74)
  })
})
