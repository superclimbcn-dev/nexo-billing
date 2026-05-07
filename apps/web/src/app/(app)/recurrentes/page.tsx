import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@nexo/core-auth'
import { listContracts } from './_lib/recurring-queries'
import { ContractList } from './_components/contract-list'
import { EmitPendingButton } from './_components/emit-pending-button'
import { emitDueInvoices } from '@/lib/recurring/emit-due-invoices'

interface PageProps {
  searchParams: Promise<{ estado?: string }>
}

export default async function RecurrentesPage({ searchParams }: PageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const { estado } = await searchParams

  await emitDueInvoices(tenantId)

  const contracts = await listContracts({ tenantId, status: estado })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
            Recurrentes
          </h1>
          <p className="text-sm text-[var(--text-dim)] mt-1">
            {contracts.length} {contracts.length === 1 ? 'contrato' : 'contratos'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <EmitPendingButton />
          <Link
            href="/recurrentes/nuevo"
            className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors"
          >
            + Nuevo contrato
          </Link>
        </div>
      </header>

      <ContractList items={contracts.map((c) => ({ ...c, total: Number(c.total) }))} status={estado ?? ''} />
    </div>
  )
}
