import Link from 'next/link'
import { formatDate } from '@nexo/core-utils'
import { InvoiceStatusBadge } from '../../_components/invoice-status-badge'
import { InvoiceStatusActions } from './invoice-status-actions'

interface Props {
  invoice: {
    id: string
    fullNumber: string
    status: string
    issuedAt: Date
    dueAt: Date | null
  }
}

function computeEffectiveStatus(status: string, dueAt: Date | null): string {
  if (status === 'sent' && dueAt && dueAt < new Date()) return 'overdue'
  return status
}

function dueDateMeta(
  dueAt: Date | null,
  effectiveStatus: string,
): { label: string; cls: string } | null {
  if (!dueAt) return null
  if (effectiveStatus === 'paid' || effectiveStatus === 'cancelled' || effectiveStatus === 'rectified') {
    return null
  }

  const now = new Date()
  const diffDays = Math.ceil((dueAt.getTime() - now.getTime()) / 86_400_000)

  if (diffDays < 0) {
    const d = Math.abs(diffDays)
    return {
      label: `Vencida hace ${d} ${d === 1 ? 'día' : 'días'}`,
      cls: 'text-[var(--danger)] font-medium',
    }
  }
  if (diffDays === 0) {
    return { label: 'Vence hoy', cls: 'text-[var(--warning)] font-medium' }
  }
  if (diffDays <= 7) {
    return {
      label: `Vence en ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`,
      cls: 'text-[var(--warning)]',
    }
  }
  return null
}

export function InvoiceDetailHeader({ invoice }: Props) {
  const effectiveStatus = computeEffectiveStatus(invoice.status, invoice.dueAt)
  const dueMeta = dueDateMeta(invoice.dueAt, effectiveStatus)

  return (
    <header className="space-y-3">
      <Link
        href="/facturas"
        className="text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
      >
        ← Volver a facturas
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
            {invoice.fullNumber}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <InvoiceStatusBadge status={effectiveStatus} />
            <span className="text-sm text-[var(--text-dim)]">
              Emitida el {formatDate(invoice.issuedAt)}
            </span>
            {invoice.dueAt && (
              <span className="text-sm text-[var(--text-dim)]">
                · Vence el {formatDate(invoice.dueAt)}
              </span>
            )}
            {dueMeta && (
              <span className={`text-sm ${dueMeta.cls}`}>· {dueMeta.label}</span>
            )}
          </div>
        </div>
        <InvoiceStatusActions invoiceId={invoice.id} status={effectiveStatus} />
      </div>
    </header>
  )
}
