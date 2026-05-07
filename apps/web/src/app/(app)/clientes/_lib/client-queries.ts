import { prisma, Prisma, InvoiceStatus } from '@nexo/prisma'

const PAGE_SIZE = 20
const PAGINATION_THRESHOLD = 50

export interface ListClientsParams {
  tenantId: string
  search?: string
  page?: number
}

export async function listClients({ tenantId, search, page = 1 }: ListClientsParams) {
  const where: Prisma.ClientWhereInput = {
    tenantId,
    isActive: true,
    ...(search && search.trim().length > 0
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { nif: { contains: search.toUpperCase().replace(/[\s-]/g, '') } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  }

  const total = await prisma.client.count({ where })
  const isPaginated = total > PAGINATION_THRESHOLD

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    ...(isPaginated ? { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE } : {}),
  })

  const clientIds = clients.map((c) => c.id)
  const invoiceStats =
    clientIds.length > 0
      ? await prisma.invoice.groupBy({
          by: ['clientId'],
          where: {
            tenantId,
            clientId: { in: clientIds },
            status: { not: InvoiceStatus.cancelled },
          },
          _count: { id: true },
          _sum: { totalAmount: true },
        })
      : []

  const statsMap = new Map(
    invoiceStats.map((s) => [
      s.clientId,
      { count: s._count.id, total: Number(s._sum.totalAmount ?? 0) },
    ]),
  )

  const items = clients.map((c) => ({
    ...c,
    invoiceCount: statsMap.get(c.id)?.count ?? 0,
    totalInvoiced: statsMap.get(c.id)?.total ?? 0,
  }))

  return {
    items,
    total,
    page,
    isPaginated,
    totalPages: isPaginated ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1,
  }
}

export async function getClientById(tenantId: string, id: string) {
  return prisma.client.findFirst({
    where: { id, tenantId, isActive: true },
  })
}

export async function getClientDetail(tenantId: string, id: string) {
  const client = await prisma.client.findFirst({
    where: { id, tenantId, isActive: true },
  })
  if (!client) return null

  const [invoiceAgg, pendingAgg, recentInvoices, invoiceCount, recentQuotes, quoteCount] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: { tenantId, clientId: id, status: { not: InvoiceStatus.cancelled } },
        _sum: { totalAmount: true },
        _max: { issuedAt: true },
      }),
      prisma.invoice.aggregate({
        where: {
          tenantId,
          clientId: id,
          status: { in: [InvoiceStatus.sent, InvoiceStatus.overdue] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.findMany({
        where: { tenantId, clientId: id },
        orderBy: { issuedAt: 'desc' },
        take: 10,
        select: { id: true, fullNumber: true, issuedAt: true, totalAmount: true, status: true },
      }),
      prisma.invoice.count({ where: { tenantId, clientId: id } }),
      prisma.quote.findMany({
        where: { tenantId, clientId: id },
        orderBy: { issuedAt: 'desc' },
        take: 10,
        select: { id: true, number: true, issuedAt: true, totalAmount: true, status: true },
      }),
      prisma.quote.count({ where: { tenantId, clientId: id } }),
    ])

  return {
    client,
    totalInvoiced: Number(invoiceAgg._sum.totalAmount ?? 0),
    pendingAmount: Number(pendingAgg._sum.totalAmount ?? 0),
    lastInvoiceAt: invoiceAgg._max.issuedAt ?? null,
    recentInvoices,
    invoiceCount,
    recentQuotes,
    quoteCount,
  }
}
