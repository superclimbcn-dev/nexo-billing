import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@nexo/core-auth'
import { listQuotes } from './_lib/quote-queries'
import { QuoteList } from './_components/quote-list'

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; estado?: string; clientId?: string }>
}

export default async function PresupuestosPage({ searchParams }: PageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const { q, page, estado, clientId } = await searchParams
  const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1

  const result = await listQuotes({
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
            Presupuestos
          </h1>
          <p className="text-sm text-[var(--text-dim)] mt-1">
            {result.total} {result.total === 1 ? 'presupuesto' : 'presupuestos'} en total
          </p>
        </div>
        <Link
          href="/presupuestos/nuevo"
          className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors"
        >
          + Nuevo presupuesto
        </Link>
      </header>

      {result.total === 0 && !q && !estado ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="text-4xl opacity-20">◫</div>
          <div>
            <p className="text-[var(--text-dim)] font-medium">No hay presupuestos todavía</p>
            <p className="text-sm text-[var(--text-subtle)] mt-1">
              Crea tu primer presupuesto y conviértelo en factura cuando sea aceptado
            </p>
          </div>
          <Link
            href="/presupuestos/nuevo"
            className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors text-sm"
          >
            + Nuevo presupuesto
          </Link>
        </div>
      ) : (
        <QuoteList
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
