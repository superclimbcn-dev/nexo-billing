import Link from 'next/link';
import { formatCurrency, formatNif, formatPhone } from '@nexo/core-utils';
import type { Client } from '@nexo/prisma';
import { ClientSearch } from './client-search';
import { ClientRowActions } from './client-row-actions';

type ClientListItem = Client & {
  invoiceCount: number;
  totalInvoiced: number;
};

interface ClientListProps {
  items: ClientListItem[];
  page: number;
  totalPages: number;
  search: string;
  isPaginated: boolean;
}

export function ClientList({ items, page, totalPages, search, isPaginated }: ClientListProps) {
  return (
    <div className="space-y-4">
      <ClientSearch initialValue={search} />

      <div className="rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                NIF
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Nº Facturas
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                Total facturado
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-dim)]">
                  No se encontraron clientes con esa búsqueda.
                </td>
              </tr>
            ) : (
              items.map((c) => {
                const rawName = c.name?.trim();
                const rawLegal = c.legalName?.trim();
                const displayName = rawLegal || rawName || '[Sin nombre]';
                const showSubtitle = rawLegal && rawLegal !== rawName && rawName;
                return (
                  <tr key={c.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="text-[var(--text)] hover:text-[var(--accent)] transition-colors font-medium"
                      >
                        {displayName}
                      </Link>
                      {showSubtitle && (
                        <p className="text-xs text-[var(--text-subtle)]">{rawName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-dim)] font-mono text-sm">
                      {formatNif(c.nif)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-dim)] text-sm">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-dim)] text-sm">
                      {c.phone ? formatPhone(c.phone) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-[var(--text-dim)]">
                      {c.invoiceCount > 0 ? c.invoiceCount : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-[var(--text)]">
                      {c.totalInvoiced > 0 ? formatCurrency(c.totalInvoiced) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ClientRowActions clientId={c.id} clientName={c.name} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isPaginated && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} search={search} />
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  search,
}: {
  page: number;
  totalPages: number;
  search: string;
}) {
  function buildHref(p: number) {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (p > 1) params.set('page', p.toString());
    const query = params.toString();
    return `/clientes${query ? `?${query}` : ''}`;
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
  );
}
