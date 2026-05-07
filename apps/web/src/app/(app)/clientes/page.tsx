import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@nexo/core-auth'
import { listClients } from './_lib/client-queries'
import { ClientList } from './_components/client-list'
import { EmptyState } from './_components/empty-state'

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function ClientesPage({ searchParams }: PageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const { q, page } = await searchParams
  const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1

  const result = await listClients({ tenantId, search: q, page: pageNum })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
            Clientes
          </h1>
          <p className="text-sm text-[var(--text-dim)] mt-1">
            {result.total} {result.total === 1 ? 'cliente' : 'clientes'} en total
          </p>
        </div>
        <Link
          href="/clientes/nuevo"
          className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors"
        >
          + Nuevo cliente
        </Link>
      </header>

      {result.total === 0 && !q ? (
        <EmptyState />
      ) : (
        <ClientList
          items={result.items}
          page={result.page}
          totalPages={result.totalPages}
          search={q ?? ''}
          isPaginated={result.isPaginated}
        />
      )}
    </div>
  )
}
