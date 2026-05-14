import { prisma, Prisma } from '@nexo/prisma'

const PAGE_SIZE = 10

const VALID_STATUSES = [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
  'converted',
] as const

type QuoteStatusValue = (typeof VALID_STATUSES)[number]

export interface ListQuotesParams {
  tenantId: string
  search?: string
  status?: string
  page?: number
  clientId?: string
}

export async function listQuotes({ tenantId, search, status, page = 1, clientId }: ListQuotesParams) {
  const validStatus = status && (VALID_STATUSES as readonly string[]).includes(status)
    ? (status as QuoteStatusValue)
    : undefined

  const where: Prisma.QuoteWhereInput = {
    tenantId,
    ...(validStatus ? { status: validStatus } : {}),
    ...(clientId ? { clientId } : {}),
    ...(search?.trim()
      ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' as const } },
            { client: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      include: { client: { select: { id: true, name: true, nif: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.quote.count({ where }),
  ])

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}

export async function getQuoteById(tenantId: string, id: string) {
  return prisma.quote.findFirst({
    where: { id, tenantId },
    include: {
      client: true,
      lines: { orderBy: { sortOrder: 'asc' } },
      invoices: {
        select: { id: true, fullNumber: true },
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}
