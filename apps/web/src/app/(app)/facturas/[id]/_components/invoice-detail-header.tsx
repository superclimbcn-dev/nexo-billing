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

export function InvoiceDetailHeader({ invoice }: Props) {
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
            <InvoiceStatusBadge status={invoice.status} />
            <span className="text-sm text-[var(--text-dim)]">
              Emitida el {formatDate(invoice.issuedAt)}
            </span>
            {invoice.dueAt && (
              <span className="text-sm text-[var(--text-dim)]">
                · Vence el {formatDate(invoice.dueAt)}
              </span>
            )}
          </div>
        </div>
        <InvoiceStatusActions invoiceId={invoice.id} status={invoice.status} />
      </div>
    </header>
  )
}
