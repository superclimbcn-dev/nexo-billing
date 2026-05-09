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
  source: 'tenant' | 'catalog'
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

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { verticalId: true },
  })

  const q = query.trim()

  // 1. Items del tenant (prioridad alta)
  const tenantItems = await prisma.item.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
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
    take: 8,
  })

  const results: ItemSearchResult[] = tenantItems.map((it) => ({
    id: it.id,
    name: it.name,
    description: it.description,
    unitPrice: Number(it.unitPrice),
    vatRate: Number(it.vatRate),
    unit: it.unit,
    type: String(it.type),
    source: 'tenant',
  }))

  // 2. Catálogo global de la vertical (si tiene vertical asignada)
  if (tenant?.verticalId) {
    const catalogItems = await prisma.catalogItem.findMany({
      where: {
        verticalId: tenant.verticalId,
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        unitPrice: true,
        vatRate: true,
        unit: true,
        category: true,
      },
      orderBy: { name: 'asc' },
      take: 6,
    })

    for (const it of catalogItems) {
      // Evitar duplicados si el tenant ya tiene un item con el mismo nombre
      if (results.some((r) => r.name.toLowerCase() === it.name.toLowerCase())) continue
      results.push({
        id: `catalog-${it.id}`,
        name: it.name,
        description: it.description,
        unitPrice: Number(it.unitPrice),
        vatRate: Number(it.vatRate),
        unit: it.unit,
        type: it.category ?? 'product',
        source: 'catalog',
      })
    }
  }

  return results.slice(0, 12)
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
