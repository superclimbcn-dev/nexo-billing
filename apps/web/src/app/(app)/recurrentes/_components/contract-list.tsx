'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { formatDate, formatCurrency } from '@nexo/core-utils'
import { ContractStatusBadge } from './contract-status-badge'
import { ContractRowActions } from './contract-row-actions'
import { frequencyLabel } from '../_lib/recurring-queries'

interface ContractItem {
  id: string
  name: string
  status: string
  frequency: string
  nextBillingAt: Date
  total: number | string
  client: { id: string; name: string; nif: string }
}

interface Props {
  items: ContractItem[]
  status: string
}

const STATUS_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'PAUSED', label: 'Pausados' },
  { value: 'CANCELLED', label: 'Cancelados' },
  { value: 'FINISHED', label: 'Finalizados' },
]

export function ContractList({ items, status }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setStatus(v: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (v) params.set('estado', v)
    else params.delete('estado')
    router.push(`/recurrentes?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              status === opt.value
                ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]'
                : 'bg-[var(--surface)] text-[var(--text-dim)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-dim)]">
          <p className="text-sm">No hay contratos que mostrar.</p>
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
                  Nombre / Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide hidden md:table-cell">
                  Frecuencia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide hidden lg:table-cell">
                  Próxima emisión
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
                  Total/ciclo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide hidden sm:table-cell">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-dim)] uppercase tracking-wide">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--text)]">{c.name}</div>
                    <div className="text-xs text-[var(--text-dim)]">
                      {c.client.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-dim)] hidden md:table-cell">
                    {frequencyLabel(c.frequency)}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-dim)] hidden lg:table-cell">
                    {formatDate(c.nextBillingAt)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--text)]">
                    {formatCurrency(Number(c.total))}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <ContractStatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ContractRowActions contractId={c.id} status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
