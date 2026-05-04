import Link from 'next/link'
import { formatCurrency } from '@nexo/core-utils'
import type { Item } from '@nexo/prisma'
import { ItemSearch } from './item-search'
import { ItemRowActions } from './item-row-actions'

interface ItemListProps {
  items: Item[]
  page: number
  totalPages: number
  search: string
  type: string
}

const TYPE_LABELS: Record<string, string> = {
  product: 'Producto',
  service: 'Servicio',
}

const TYPE_CLASSES: Record<string, string> = {
  product:
    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--success)]/15 text-[var(--success)]',
  service:
    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--accent)]/15 text-[var(--accent)]',
}

const DEFAULT_BADGE =
  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--surface-raised)] text-[var(--text-dim)]'

export function ItemList({ items, page, totalPages, search, type }: ItemListProps) {
  return (
    <div className="space-y-4">
      <ItemSearch initialSearch={search} initialType={type} />

      <div className="rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Precio unitario
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                IVA
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-dim)]">
                  No se encontraron productos con esa búsqueda.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/productos/${item.id}`}
                      className="text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={TYPE_CLASSES[item.type] ?? DEFAULT_BADGE}>
                      {TYPE_LABELS[item.type] ?? item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-dim)] text-sm font-mono">
                    {formatCurrency(Number(item.unitPrice))}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--surface-raised)] text-[var(--text-dim)]">
                      {Math.round(Number(item.vatRate))}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ItemRowActions itemId={item.id} itemName={item.name} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} search={search} type={type} />
      )}
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  search,
  type,
}: {
  page: number
  totalPages: number
  search: string
  type: string
}) {
  function buildHref(p: number) {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (type) params.set('tipo', type)
    if (p > 1) params.set('page', p.toString())
    const query = params.toString()
    return `/productos${query ? `?${query}` : ''}`
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
