'use server'

import { prisma } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { clientSchema } from './client-schema'
import { requireOwnerOrAdminAction } from '@/lib/auth/role-guard'

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

export async function createClient(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return { ok: false, error: 'No tienes permiso para realizar esta acción' }
  const { tenantId } = auth

  const parsed = clientSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const existing = await prisma.client.findFirst({
    where: { tenantId, nif: parsed.data.nif, isActive: true },
  })
  if (existing) {
    return {
      ok: false,
      error: 'Ya existe un cliente con ese NIF',
      fieldErrors: { nif: ['NIF ya registrado'] },
    }
  }

  const created = await prisma.client.create({
    data: { ...parsed.data, tenantId },
    select: { id: true },
  })

  revalidatePath('/clientes')
  return { ok: true, data: { id: created.id } }
}

export async function updateClient(id: string, raw: unknown): Promise<ActionResult> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return { ok: false, error: 'No tienes permiso para realizar esta acción' }
  const { tenantId } = auth

  const parsed = clientSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const owned = await prisma.client.findFirst({
    where: { id, tenantId, isActive: true },
  })
  if (!owned) return { ok: false, error: 'Cliente no encontrado' }

  const dup = await prisma.client.findFirst({
    where: { tenantId, nif: parsed.data.nif, isActive: true, NOT: { id } },
  })
  if (dup) {
    return {
      ok: false,
      error: 'Ya existe otro cliente con ese NIF',
      fieldErrors: { nif: ['NIF ya registrado en otro cliente'] },
    }
  }

  await prisma.client.update({ where: { id }, data: parsed.data })

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return { ok: true, data: undefined }
}

export async function softDeleteClient(id: string): Promise<ActionResult> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return { ok: false, error: 'No tienes permiso para realizar esta acción' }
  const { tenantId } = auth

  const owned = await prisma.client.findFirst({
    where: { id, tenantId, isActive: true },
  })
  if (!owned) return { ok: false, error: 'Cliente no encontrado' }

  await prisma.client.update({ where: { id }, data: { isActive: false } })

  revalidatePath('/clientes')
  return { ok: true, data: undefined }
}
