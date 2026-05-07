import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@nexo/core-auth'
import { listInvoices } from './_lib/invoice-queries'
import { InvoiceList } from './_components/invoice-list'
import { EmptyState } from './_components/empty-state'
import { syncOverdueInvoices } from './[id]/_lib/invoice-status-actions'

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; estado?: string; clientId?: string }>
}

export default async function FacturasPage({ searchParams }: PageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const { q, page, estado, clientId } = await searchParams
  const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1

  await syncOverdueInvoices(tenantId)

  const result = await listInvoices({
    tenantId,
    search: q,
    status: estado,
    page: pageNum,
    clientId,
  })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
            Facturas
          </h1>
          <p className="text-sm text-[var(--text-dim)] mt-1">
            {result.total} {result.total === 1 ? 'factura' : 'facturas'} en total
          </p>
        </div>
        <Link
          href="/facturas/nueva"
          className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors"
        >
          + Nueva factura
        </Link>
      </header>

      {result.total === 0 && !q && !estado ? (
        <EmptyState />
      ) : (
        <InvoiceList
          items={result.items}
          page={result.page}
          totalPages={result.totalPages}
          search={q ?? ''}
          status={estado ?? ''}
          clientId={clientId}
        />
      )}
    </div>
  )
}
