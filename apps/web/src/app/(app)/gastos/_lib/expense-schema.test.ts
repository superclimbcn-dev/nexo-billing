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

describe('expense payment validation', () => {
  const input = { amount: '121', date: '2026-01-10', category: 'OTROS', vatRate: 21 }

  it('defaults to paid and uses the expense date for an existing paid ticket', async () => {
    const { expensePaymentData } = await import('./expense-payment')
    const parsed = expenseSchema.parse(input)
    assert.equal(parsed.status, 'paid')
    assert.deepEqual(expensePaymentData(parsed), {
      status: 'paid', paidAt: new Date('2026-01-10'), paymentMethod: null,
    })
  })

  it('clears payment details when pending without changing fiscal input', async () => {
    const { expensePaymentData } = await import('./expense-payment')
    const parsed = expenseSchema.parse({ ...input, status: 'pending', paidAt: '2026-02-15', paymentMethod: 'card' })
    assert.deepEqual(expensePaymentData(parsed), { status: 'pending', paidAt: null, paymentMethod: null })
    assert.equal(parsed.vatRate, 21)
    assert.equal(parsed.amount, 121)
  })

  it('requires a real past payment date and a supported method for settlement', async () => {
    const { markExpensePaidSchema } = await import('./expense-payment')
    for (const raw of [
      {}, { paidAt: '2026-02-15' }, { paidAt: '2026-02-30', paymentMethod: 'card' },
      { paidAt: '2099-01-01', paymentMethod: 'card' }, { paidAt: '2026-02-15', paymentMethod: 'invalid' },
    ]) assert.equal(markExpensePaidSchema.safeParse(raw).success, false)
    assert.equal(markExpensePaidSchema.safeParse({ paidAt: '2026-02-15', paymentMethod: 'card' }).success, true)
  })
})
