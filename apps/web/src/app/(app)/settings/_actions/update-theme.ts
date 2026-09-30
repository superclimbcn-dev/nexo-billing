'use server'

import { prisma } from '@nexo/prisma'
import { revalidatePath } from 'next/cache'
import { THEMES, type ThemeKey } from '@/lib/themes'
import { requireOwnerOrAdminAction } from '@/lib/auth/role-guard'

type Result = { ok: true } | { ok: false; error: string }

export async function updateTheme(theme: string): Promise<Result> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return { ok: false, error: 'No tienes permiso para realizar esta acción' }
  const { tenantId } = auth

  const validThemes = Object.keys(THEMES) as ThemeKey[]
  if (!validThemes.includes(theme as ThemeKey)) {
    return { ok: false, error: 'Tema no válido' }
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { theme },
  })

  revalidatePath('/', 'layout')
  return { ok: true }
}
