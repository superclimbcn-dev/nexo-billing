'use server'

import { prisma } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { itemSchema } from './item-schema'

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

async function requireAuth() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  return { user, tenantId }
}

export async function createItem(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const { tenantId } = await requireAuth()

  const parsed = itemSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const created = await prisma.item.create({
    data: { ...parsed.data, tenantId },
    select: { id: true },
  })

  revalidatePath('/productos')
  return { ok: true, data: { id: created.id } }
}

export async function updateItem(id: string, raw: unknown): Promise<ActionResult> {
  const { tenantId } = await requireAuth()

  const parsed = itemSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const owned = await prisma.item.findFirst({
    where: { id, tenantId, isActive: true },
  })
  if (!owned) return { ok: false, error: 'Producto no encontrado' }

  await prisma.item.update({ where: { id }, data: parsed.data })

  revalidatePath('/productos')
  revalidatePath(`/productos/${id}`)
  return { ok: true, data: undefined }
}

export async function softDeleteItem(id: string): Promise<ActionResult> {
  const { tenantId } = await requireAuth()

  const owned = await prisma.item.findFirst({
    where: { id, tenantId, isActive: true },
  })
  if (!owned) return { ok: false, error: 'Producto no encontrado' }

  await prisma.item.update({ where: { id }, data: { isActive: false } })

  revalidatePath('/productos')
  return { ok: true, data: undefined }
}
