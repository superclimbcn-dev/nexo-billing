import Link from 'next/link'
import { formatCurrency } from '@nexo/core-utils'
import { Panel } from '@nexo/core-ui'
import { InvoiceStatusBadge } from '../../facturas/_components/invoice-status-badge'

interface RecentInvoice {
  id: string
  fullNumber: string
  issuedAt: Date
  status: string
  totalAmount: number
  clientName: string
}

export function RecentInvoices({ invoices }: { invoices: RecentInvoice[] }) {
  return (
    <Panel
      title="Últimas facturas"
      headerRight={
        <Link href="/facturas" className="text-xs text-[var(--accent)] hover:underline">
          Ver todas →
        </Link>
      }
    >
      {invoices.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-[var(--text-dim)]">No hay facturas todavía.</p>
          <Link
            href="/facturas/nueva"
            className="inline-block mt-3 text-sm text-[var(--accent)] hover:underline"
          >
            Crear primera factura →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {invoices.map((inv) => (
            <Link
              key={inv.id}
              href={`/facturas/${inv.id}`}
              className="flex items-center justify-between px-6 py-3 hover:bg-[var(--surface-hover)] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-sm font-medium text-[var(--text)]">
                  {inv.fullNumber}
                </span>
                <span className="text-sm text-[var(--text-dim)] truncate">{inv.clientName}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-mono text-[var(--text)]">
                  {formatCurrency(inv.totalAmount)}
                </span>
                <InvoiceStatusBadge status={inv.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  )
}
