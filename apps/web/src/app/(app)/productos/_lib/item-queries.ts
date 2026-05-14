import { prisma, Prisma } from '@nexo/prisma'

const PAGE_SIZE = 10

export interface ListItemsParams {
  tenantId: string
  search?: string
  type?: 'product' | 'service'
  page?: number
}

export async function listItems({ tenantId, search, type, page = 1 }: ListItemsParams) {
  const where: Prisma.ItemWhereInput = {
    tenantId,
    isActive: true,
    ...(type ? { type } : {}),
    ...(search && search.trim().length > 0
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.item.count({ where }),
  ])

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}

export async function getItemById(tenantId: string, id: string) {
  return prisma.item.findFirst({
    where: { id, tenantId, isActive: true },
  })
}
