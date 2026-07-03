import Link from 'next/link'
import { formatCurrency, formatDate } from '@nexo/core-utils'
import { ReceiptSearch } from './receipt-search'
import { ReceiptStatusBadge } from './receipt-status-badge'

interface ReceiptRow {
  id: string
  number: string
  issuedAt: Date
  totalAmount: { toString(): string }
  status: string
  client: { id: string; name: string; nif: string } | null
}

interface ReceiptListProps {
  items: ReceiptRow[]
  page: number
  totalPages: number
  search: string
  status: string
  clientId?: string
}

export function ReceiptList({ items, page, totalPages, search, status, clientId }: ReceiptListProps) {
  return (
    <div className="space-y-4">
      <ReceiptSearch initialSearch={search} initialStatus={status} clientId={clientId} />

      <div className="rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Número
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Fecha
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
                  No se encontraron recibos con esa búsqueda.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/recibos/${r.id}`}
                      className="font-mono text-sm text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                    >
                      {r.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {r.client ? (
                      <div>
                        <p className="text-sm text-[var(--text)]">{r.client.name}</p>
                        <p className="text-xs text-[var(--text-dim)] font-mono">{r.client.nif}</p>
                      </div>
                    ) : (
                      <span className="text-[var(--text-dim)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-dim)] text-sm">
                    {formatDate(r.issuedAt)}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-[var(--text)]">
                    {formatCurrency(Number(r.totalAmount))}
                  </td>
                  <td className="px-4 py-3">
                    <ReceiptStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/recibos/${r.id}`}
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
        <Pagination page={page} totalPages={totalPages} search={search} status={status} clientId={clientId} />
      )}
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  search,
  status,
  clientId,
}: {
  page: number
  totalPages: number
  search: string
  status: string
  clientId?: string
}) {
  function buildHref(p: number) {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (status) params.set('estado', status)
    if (clientId) params.set('clientId', clientId)
    if (p > 1) params.set('page', p.toString())
    const query = params.toString()
    return `/recibos${query ? `?${query}` : ''}`
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
