import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@nexo/core-auth'
import { listItems } from './_lib/item-queries'
import { ItemList } from './_components/item-list'
import { EmptyState } from './_components/empty-state'

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; tipo?: string }>
}

export default async function ProductosPage({ searchParams }: PageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const { q, page, tipo } = await searchParams
  const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1
  const typeFilter = tipo === 'product' || tipo === 'service' ? tipo : undefined

  const result = await listItems({ tenantId, search: q, type: typeFilter, page: pageNum })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
            Productos
          </h1>
          <p className="text-sm text-[var(--text-dim)] mt-1">
            {result.total} {result.total === 1 ? 'producto' : 'productos'} en total
          </p>
        </div>
        <Link
          href="/productos/nuevo"
          className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors"
        >
          + Nuevo producto
        </Link>
      </header>

      {result.total === 0 && !q && !typeFilter ? (
        <EmptyState />
      ) : (
        <ItemList
          items={result.items}
          page={result.page}
          totalPages={result.totalPages}
          search={q ?? ''}
          type={tipo ?? ''}
        />
      )}
    </div>
  )
}
