import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { getCashFlow, getPendingPayments, getTreasuryKpis, getTreasuryAlerts } from './tesoreria-actions'

const db = vi.hoisted(() => ({
  expense: { findMany: vi.fn(), aggregate: vi.fn() },
  invoice: { findMany: vi.fn(), aggregate: vi.fn() },
}))
vi.mock('@nexo/prisma', () => ({ prisma: db }))
vi.mock('@nexo/core-auth', () => ({
  createServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: { app_metadata: { tenant_id: 'tenant-a' } } } }) } }),
}))

beforeEach(() => { vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-08T12:00:00Z')) })
afterEach(() => vi.useRealTimers())

describe('treasury payment separation', () => {
  it('places a January expense paid in September in September cash out', async () => {
    db.invoice.findMany.mockResolvedValue([])
    db.expense.findMany.mockResolvedValue([{ issuedAt: new Date('2026-01-15'), paidAt: new Date('2026-09-02'), totalAmount: 121 }])
    const result = await getCashFlow(6)
    expect(db.expense.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a', status: 'paid', paidAt: { gte: expect.any(Date), lte: expect.any(Date) } },
      select: { paidAt: true, totalAmount: true },
    })
    expect(result.totalOut).toBe(121)
    expect(result.points.find((p) => p.date === '2026-09')?.cashOut).toBe(121)
    expect(result.points.slice(0, -1).every((p) => p.cashOut === 0)).toBe(true)
  })

  it('loads only pending payments, including older months and more than 50 expenses', async () => {
    db.expense.findMany.mockResolvedValue(Array.from({ length: 60 }, (_, id) => ({
      id: String(id), totalAmount: 10, notes: 'Older pending expense', issuedAt: new Date('2026-01-15'), dueAt: null, category: 'OTROS',
    })))
    const result = await getPendingPayments()
    expect(db.expense.findMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a', status: 'pending' }, orderBy: [{ dueAt: 'asc' }, { issuedAt: 'asc' }] })
    expect(result.total).toBe(600)
    expect(result.items).toHaveLength(60)
  })

  it('subtracts paid expenses from balance and counts only pending expenses as payable', async () => {
    db.invoice.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 1000 } }).mockResolvedValueOnce({ _sum: { totalAmount: 200 }, _count: { _all: 2 } })
    db.expense.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 300 }, _count: { _all: 3 } }).mockResolvedValueOnce({ _sum: { totalAmount: 121 } })
    expect(await getTreasuryKpis()).toEqual({ currentBalance: 879, pendingIn: 200, pendingOut: 300, pendingInCount: 2, pendingOutCount: 3 })
    expect(db.expense.aggregate.mock.calls[0]![0].where).toEqual({ tenantId: 'tenant-a', status: 'pending' })
    expect(db.expense.aggregate.mock.calls[1]![0].where).toEqual({ tenantId: 'tenant-a', status: 'paid', paidAt: { lte: expect.any(Date) } })
  })

  it('uses paid expenses and payment dates in cash alerts', async () => {
    db.invoice.aggregate.mockResolvedValue({ _sum: { totalAmount: 0 } })
    db.expense.aggregate.mockResolvedValue({ _sum: { totalAmount: 121 } })
    const alerts = await getTreasuryAlerts()
    expect(alerts.some((a) => a.message === 'Saldo acumulado negativo')).toBe(true)
    for (const [call] of db.expense.aggregate.mock.calls) {
      expect(call.where).toMatchObject({ tenantId: 'tenant-a', status: 'paid', paidAt: { lte: expect.any(Date) } })
      expect(call.where.issuedAt).toBeUndefined()
    }
  })
})
