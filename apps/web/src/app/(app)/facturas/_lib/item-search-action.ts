'use server'

import { prisma } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'
import { unstable_noStore as noStore, revalidatePath } from 'next/cache'

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
  noStore()
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

export async function searchCatalogTopItems(): Promise<ItemSearchResult[]> {
  noStore()
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
  if (!tenant?.verticalId) return []

  const catalogItems = await prisma.catalogItem.findMany({
    where: {
      verticalId: tenant.verticalId,
      isActive: true,
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
    take: 10,
  })

  return catalogItems.map((it) => ({
    id: `catalog-${it.id}`,
    name: it.name,
    description: it.description,
    unitPrice: Number(it.unitPrice),
    vatRate: Number(it.vatRate),
    unit: it.unit,
    type: it.category ?? 'product',
    source: 'catalog',
  }))
}

export async function createItemQuick(data: {
  name: string
  description?: string
  unitPrice: number
  vatRate: number
  unit?: string
  type?: string
}): Promise<{ ok: true; item: ItemSearchResult } | { ok: false; error: string }> {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'No autenticado' }
    const tenantId = user.app_metadata?.tenant_id as string | undefined
    if (!tenantId) return { ok: false, error: 'Tenant no encontrado' }

    const created = await prisma.item.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description ?? null,
        unitPrice: data.unitPrice,
        vatRate: data.vatRate,
        unit: data.unit ?? 'ud',
        type: (data.type as 'product' | 'service' | 'subscription' | 'kit' | 'digital') ?? 'product',
        isActive: true,
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
    })

    revalidatePath('/facturas/nueva')
    revalidatePath('/productos')
    return {
      ok: true,
      item: {
        id: created.id,
        name: created.name,
        description: created.description,
        unitPrice: Number(created.unitPrice),
        vatRate: Number(created.vatRate),
        unit: created.unit,
        type: String(created.type),
        source: 'tenant',
      },
    }
  } catch (err) {
    console.error('[createItemQuick] error:', err)
    const message = err instanceof Error ? err.message : 'Error desconocido al crear producto'
    return { ok: false, error: message }
  }
}

export async function createClientQuick(data: {
  name: string
  nif?: string
  email?: string
}): Promise<{ ok: true; client: { id: string; name: string; nif: string; email: string | null } } | { ok: false; error: string }> {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'No autenticado' }
    const tenantId = user.app_metadata?.tenant_id as string | undefined
    if (!tenantId) return { ok: false, error: 'Tenant no encontrado' }

    const name = data.name.trim()
    const nif = (data.nif ?? '').trim().toUpperCase().replace(/[\s-]/g, '')
    const email = data.email?.trim() || null

    if (!name) return { ok: false, error: 'El nombre es obligatorio' }
    if (name.length > 200) return { ok: false, error: 'El nombre es demasiado largo' }
    if (nif && nif.length > 20) return { ok: false, error: 'NIF demasiado largo' }
    if (email && email.length > 254) return { ok: false, error: 'Email demasiado largo' }

    // For non-empty NIF: return existing client if found (idempotent by NIF)
    // For empty NIF: @@unique([tenantId, nif]) allows only one per tenant — check first
    const existing = await prisma.client.findFirst({
      where: { tenantId, nif: nif || '', isActive: true },
      select: { id: true, name: true, nif: true, email: true },
    })
    if (existing) {
      if (!nif) {
        return {
          ok: false,
          error: 'Ya existe un cliente sin NIF. Añade el NIF para crear uno nuevo, o busca el cliente existente.',
        }
      }
      return { ok: true, client: existing }
    }

    const created = await prisma.client.create({
      data: {
        tenantId,
        name,
        nif: nif || '',
        email,
        isActive: true,
      },
      select: { id: true, name: true, nif: true, email: true },
    })

    revalidatePath('/facturas/nueva')
    revalidatePath('/clientes')
    return { ok: true, client: created }
  } catch (err) {
    console.error('[createClientQuick] error:', err)
    const message = err instanceof Error ? err.message : 'Error desconocido al crear cliente'
    return { ok: false, error: message }
  }
}

export async function searchClientsForAutocomplete(query: string) {
  noStore()
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
