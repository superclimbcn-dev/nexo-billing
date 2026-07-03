import { prisma, Prisma } from '@nexo/prisma'

const PAGE_SIZE = 10

const VALID_STATUSES = ['draft', 'issued', 'cancelled'] as const

type ReceiptStatusValue = (typeof VALID_STATUSES)[number]

export interface ListReceiptsParams {
  tenantId: string
  search?: string
  status?: string
  page?: number
  clientId?: string
}

export async function listReceipts({
  tenantId,
  search,
  status,
  page = 1,
  clientId,
}: ListReceiptsParams) {
  const validStatus = status && (VALID_STATUSES as readonly string[]).includes(status)
    ? (status as ReceiptStatusValue)
    : undefined

  const where: Prisma.ReceiptWhereInput = {
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
    prisma.receipt.findMany({
      where,
      include: { client: { select: { id: true, name: true, nif: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.receipt.count({ where }),
  ])

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}

export async function getReceiptById(tenantId: string, id: string) {
  return prisma.receipt.findFirst({
    where: { id, tenantId },
    include: {
      client: true,
      lines: { orderBy: { sortOrder: 'asc' } },
    },
  })
}
