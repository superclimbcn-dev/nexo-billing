import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { ContractForm } from '../_components/contract-form'

export default async function NuevoContratPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const series = await prisma.invoiceSeries.findMany({
    where: { tenantId, isActive: true },
    select: { code: true, name: true },
    orderBy: { code: 'asc' },
  })

  if (series.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <Link
            href="/recurrentes"
            className="text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          >
            ← Volver a recurrentes
          </Link>
          <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)] mt-2">
            Nuevo contrato
          </h1>
        </header>
        <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-center">
          <p className="text-[var(--text-dim)] text-sm mb-3">
            Necesitas al menos una serie de facturación activa antes de crear contratos.
          </p>
          <Link
            href="/settings"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Ir a ajustes →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/recurrentes"
          className="text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
        >
          ← Volver a recurrentes
        </Link>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)] mt-2">
          Nuevo contrato recurrente
        </h1>
      </header>

      <ContractForm mode="create" seriesOptions={series} />
    </div>
  )
}
