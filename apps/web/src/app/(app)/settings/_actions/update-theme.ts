'use server'

import { prisma } from '@nexo/prisma'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@nexo/core-auth'
import { THEMES, type ThemeKey } from '@/lib/themes'

type Result = { ok: true } | { ok: false; error: string }

export async function updateTheme(theme: string): Promise<Result> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado' }

  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) return { ok: false, error: 'Tenant no encontrado' }

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
