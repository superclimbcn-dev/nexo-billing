import { prisma, Prisma, InvoiceStatus } from '@nexo/prisma'

const PAGE_SIZE = 10

export interface ListInvoicesParams {
  tenantId: string
  search?: string
  status?: string
  page?: number
  clientId?: string
}

export async function listInvoices({
  tenantId,
  search,
  status,
  page = 1,
  clientId,
}: ListInvoicesParams) {
  const validStatus = status
    ? (Object.values(InvoiceStatus).includes(status as InvoiceStatus)
        ? (status as InvoiceStatus)
        : undefined)
    : undefined

  const where: Prisma.InvoiceWhereInput = {
    tenantId,
    ...(validStatus ? { status: validStatus } : {}),
    ...(clientId ? { clientId } : {}),
    ...(search?.trim()
      ? {
          OR: [
            { fullNumber: { contains: search, mode: 'insensitive' as const } },
            { client: { name: { contains: search, mode: 'insensitive' as const } } },
            {
              client: {
                nif: { contains: search.toUpperCase().replace(/[\s-]/g, '') },
              },
            },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, nif: true } },
        series: { select: { code: true, name: true } },
        records: { select: { status: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { issuedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.invoice.count({ where }),
  ])

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}

export async function getInvoiceById(tenantId: string, id: string) {
  return prisma.invoice.findFirst({
    where: { id, tenantId },
    include: {
      client: true,
      series: true,
      lines: {
        include: { item: { select: { id: true, name: true, unit: true } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
}
