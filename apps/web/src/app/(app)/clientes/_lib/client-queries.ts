import { prisma, Prisma } from '@nexo/prisma'

const PAGE_SIZE = 10

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
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.client.count({ where }),
  ])

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}

export async function getClientById(tenantId: string, id: string) {
  return prisma.client.findFirst({
    where: { id, tenantId, isActive: true },
  })
}
