'use server'

import { prisma } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'

export interface ItemSearchResult {
  id: string
  name: string
  description: string | null
  unitPrice: number
  vatRate: number
  unit: string | null
  type: string
}

export async function searchItemsForAutocomplete(
  query: string,
): Promise<ItemSearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) return []

  const items = await prisma.item.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      unitPrice: true,
      vatRate: true,
      unit: true,
      type: true,
    },
    orderBy: { name: 'asc' },
    take: 10,
  })

  return items.map((it) => ({
    id: it.id,
    name: it.name,
    description: it.description,
    unitPrice: Number(it.unitPrice),
    vatRate: Number(it.vatRate),
    unit: it.unit,
    type: String(it.type),
  }))
}

export async function searchClientsForAutocomplete(query: string) {
  if (!query || query.trim().length < 2) return []

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) return []

  return prisma.client.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { nif: { contains: query.toUpperCase().replace(/[\s-]/g, '') } },
      ],
    },
    select: { id: true, name: true, nif: true, email: true },
    orderBy: { name: 'asc' },
    take: 10,
  })
}
