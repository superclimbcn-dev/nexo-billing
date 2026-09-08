import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createExpense, markExpensePaid, updateExpense } from './expense-actions'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), revalidate: vi.fn(),
  expense: { create: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  expenseLine: { create: vi.fn(), update: vi.fn() },
}))
vi.mock('@nexo/prisma', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nexo/prisma')>()
  return { ...actual, prisma: { expense: mocks.expense, $transaction: async (callback: (tx: typeof mocks) => unknown) => callback(mocks) } }
})
vi.mock('@/lib/auth/role-guard', () => ({ requireOwnerOrAdminAction: mocks.auth }))
vi.mock('@nexo/core-auth', () => ({ createServerClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }))

beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ tenantId: 'tenant-a' })
  mocks.expense.create.mockResolvedValue({ id: 'new-expense' })
  mocks.expense.updateMany.mockResolvedValue({ count: 1 })
})
const input = { amount: '121', date: '2026-01-15', category: 'OTROS', vatRate: 21, vatDeductiblePercent: 50, irpfDeductiblePercent: 100 }

describe('expense payment persistence', () => {
  it.each(['paid', 'pending'] as const)('creates %s expenses with the same fiscal amounts', async (status) => {
    expect((await createExpense({ ...input, status })).ok).toBe(true)
    const data = mocks.expense.create.mock.calls[0]![0].data
    expect(data.status).toBe(status)
    expect(data.paidAt).toEqual(status === 'paid' ? new Date(input.date) : null)
    expect(data.paymentMethod).toBeNull()
    expect(Number(data.totalAmount)).toBe(121)
    expect(Number(data.subtotal)).toBe(100)
    expect(Number(data.vatAmount)).toBe(21)
    expect(Number(data.vatDeductiblePercent)).toBe(50)
    expect(Number(data.irpfDeductiblePercent)).toBe(100)
  })

  it('settles a pending expense atomically without touching fiscal fields or lines', async () => {
    expect((await markExpensePaid('expense-a', { paidAt: '2026-02-02', paymentMethod: 'card' })).ok).toBe(true)
    expect(mocks.expense.updateMany).toHaveBeenCalledTimes(1)
    expect(mocks.expense.updateMany).toHaveBeenCalledWith({
      where: { id: 'expense-a', tenantId: 'tenant-a', status: 'pending' },
      data: { status: 'paid', paidAt: new Date('2026-02-02'), paymentMethod: 'card' },
    })
    expect(mocks.expenseLine.update).not.toHaveBeenCalled()
    expect(mocks.expenseLine.create).not.toHaveBeenCalled()
    expect(mocks.revalidate).toHaveBeenCalledWith('/gastos')
    expect(mocks.revalidate).toHaveBeenCalledWith('/tesoreria')
  })

  it('rejects unauthorized users before touching payment data', async () => {
    mocks.auth.mockResolvedValue(null)
    expect((await markExpensePaid('expense-a', { paidAt: '2026-02-02', paymentMethod: 'card' })).ok).toBe(false)
    expect(mocks.expense.updateMany).not.toHaveBeenCalled()
  })

  it('does not settle an already paid expense or an expense outside the tenant', async () => {
    mocks.expense.updateMany.mockResolvedValue({ count: 0 })
    expect((await markExpensePaid('other-expense', { paidAt: '2026-02-02', paymentMethod: 'card' })).ok).toBe(false)
    expect(mocks.revalidate).not.toHaveBeenCalled()
  })

  it('requires date and method through the full edit route too', async () => {
    mocks.expense.findFirst.mockResolvedValue({ status: 'pending', lines: [] })
    expect((await updateExpense('expense-a', { ...input, status: 'paid' })).ok).toBe(false)
    expect(mocks.expense.update).not.toHaveBeenCalled()
  })

  it('preserves legacy fiscal amounts when settling through the edit form', async () => {
    mocks.expense.findFirst.mockResolvedValue({ status: 'pending', lines: [], totalAmount: 121, subtotal: 100, vatAmount: 21 })
    mocks.expense.update.mockResolvedValue({ id: 'expense-a' })
    expect((await updateExpense('expense-a', {
      ...input, vatRate: null, status: 'paid', paidAt: '2026-02-02', paymentMethod: 'card',
    })).ok).toBe(true)
    const data = mocks.expense.update.mock.calls[0]![0].data
    expect(Number(data.subtotal)).toBe(100)
    expect(Number(data.vatAmount)).toBe(21)
    expect(Number(data.totalAmount)).toBe(121)
    expect(data.status).toBe('paid')
    expect(mocks.expenseLine.create).not.toHaveBeenCalled()
  })
})
