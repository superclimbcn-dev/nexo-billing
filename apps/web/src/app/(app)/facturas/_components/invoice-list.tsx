import Link from 'next/link'
import { formatCurrency, formatDate } from '@nexo/core-utils'
import { InvoiceSearch } from './invoice-search'
import { InvoiceStatusBadge } from './invoice-status-badge'

interface InvoiceRow {
  id: string
  fullNumber: string
  issuedAt: Date
  totalAmount: { toString(): string }
  status: string
  client: { id: string; name: string; nif: string } | null
  series: { code: string; name: string } | null
}

interface InvoiceListProps {
  items: InvoiceRow[]
  page: number
  totalPages: number
  search: string
  status: string
}

export function InvoiceList({ items, page, totalPages, search, status }: InvoiceListProps) {
  return (
    <div className="space-y-4">
      <InvoiceSearch initialSearch={search} initialStatus={status} />

      <div className="rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Número
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-dim)]">
                  No se encontraron facturas con esa búsqueda.
                </td>
              </tr>
            ) : (
              items.map((inv) => (
                <tr key={inv.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/facturas/${inv.id}`}
                      className="font-mono text-sm text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                    >
                      {inv.fullNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-dim)] text-sm">
                    {formatDate(inv.issuedAt)}
                  </td>
                  <td className="px-4 py-3">
                    {inv.client ? (
                      <div>
                        <p className="text-sm text-[var(--text)]">{inv.client.name}</p>
                        <p className="text-xs text-[var(--text-dim)] font-mono">
                          {inv.client.nif}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[var(--text-dim)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-[var(--text)]">
                    {formatCurrency(Number(inv.totalAmount))}
                  </td>
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/facturas/${inv.id}`}
                      className="text-sm text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} search={search} status={status} />
      )}
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  search,
  status,
}: {
  page: number
  totalPages: number
  search: string
  status: string
}) {
  function buildHref(p: number) {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (status) params.set('estado', status)
    if (p > 1) params.set('page', p.toString())
    const query = params.toString()
    return `/facturas${query ? `?${query}` : ''}`
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--text-dim)]">
        Página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={buildHref(page - 1)}
            className="px-3 py-1 border border-[var(--border)] rounded hover:bg-[var(--surface-hover)] transition-colors"
          >
            ← Anterior
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={buildHref(page + 1)}
            className="px-3 py-1 border border-[var(--border)] rounded hover:bg-[var(--surface-hover)] transition-colors"
          >
            Siguiente →
          </Link>
        )}
      </div>
    </div>
  )
}
