import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { ThemePicker } from './_components/theme-picker'

export default async function AparienciaPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { theme: true },
  })
  if (!tenant) redirect('/onboarding/cuenta')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Apariencia</h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          Personaliza los colores de tu espacio de trabajo
        </p>
      </div>
      <ThemePicker currentTheme={tenant.theme} />
    </div>
  )
}
