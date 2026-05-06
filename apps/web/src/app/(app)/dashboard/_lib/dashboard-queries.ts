import { prisma, InvoiceStatus } from '@nexo/prisma'

export interface DashboardStats {
  invoicedThisMonth: { amount: number; count: number }
  invoicedLastMonth: { amount: number; count: number }
  pendingCollection: { amount: number; count: number }
  overdue: { amount: number; count: number }
  activeClients: number
  catalogItems: number
  recentInvoices: Array<{
    id: string
    fullNumber: string
    issuedAt: Date
    status: string
    totalAmount: number
    clientName: string
  }>
}

function monthStart(year: number, month: number): Date {
  return new Date(year, month, 1)
}

export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  const now = new Date()
  const thisMonthStart = monthStart(now.getFullYear(), now.getMonth())
  const lastMonthStart = monthStart(now.getFullYear(), now.getMonth() - 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  const excludedStatuses = [InvoiceStatus.draft, InvoiceStatus.cancelled]

  const [
    invoicedThisMonthAgg,
    invoicedLastMonthAgg,
    pendingAgg,
    overdueAgg,
    activeClients,
    catalogItems,
    recentInvoices,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: {
        tenantId,
        issuedAt: { gte: thisMonthStart },
        status: { notIn: excludedStatuses },
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),

    prisma.invoice.aggregate({
      where: {
        tenantId,
        issuedAt: { gte: lastMonthStart, lte: lastMonthEnd },
        status: { notIn: excludedStatuses },
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),

    prisma.invoice.aggregate({
      where: {
        tenantId,
        status: { in: [InvoiceStatus.sent, InvoiceStatus.overdue, InvoiceStatus.partially_paid] },
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),

    prisma.invoice.aggregate({
      where: {
        tenantId,
        OR: [
          { status: InvoiceStatus.overdue },
          { status: InvoiceStatus.sent, dueAt: { lt: now } },
        ],
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),

    prisma.client.count({ where: { tenantId, isActive: true } }),

    prisma.item.count({ where: { tenantId, isActive: true } }),

    prisma.invoice.findMany({
      where: { tenantId },
      include: { client: { select: { name: true } } },
      orderBy: { issuedAt: 'desc' },
      take: 5,
    }),
  ])

  return {
    invoicedThisMonth: {
      amount: Number(invoicedThisMonthAgg._sum.totalAmount ?? 0),
      count: invoicedThisMonthAgg._count._all,
    },
    invoicedLastMonth: {
      amount: Number(invoicedLastMonthAgg._sum.totalAmount ?? 0),
      count: invoicedLastMonthAgg._count._all,
    },
    pendingCollection: {
      amount: Number(pendingAgg._sum.totalAmount ?? 0),
      count: pendingAgg._count._all,
    },
    overdue: {
      amount: Number(overdueAgg._sum.totalAmount ?? 0),
      count: overdueAgg._count._all,
    },
    activeClients,
    catalogItems,
    recentInvoices: recentInvoices.map((inv) => ({
      id: inv.id,
      fullNumber: inv.fullNumber,
      issuedAt: inv.issuedAt,
      status: inv.status,
      totalAmount: Number(inv.totalAmount),
      clientName: inv.client.name,
    })),
  }
}
