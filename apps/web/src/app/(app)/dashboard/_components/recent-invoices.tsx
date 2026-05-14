import Link from 'next/link';
import { formatCurrency, formatDate } from '@nexo/core-utils';
import { Panel } from '@nexo/core-ui';
import { InvoiceStatusBadge } from '../../facturas/_components/invoice-status-badge';

interface RecentInvoice {
  id: string;
  fullNumber: string;
  issuedAt: Date;
  status: string;
  totalAmount: number;
  clientName: string;
}

export function RecentInvoices({ invoices }: { invoices: RecentInvoice[] }) {
  return (
    <Panel
      title="Facturas recientes"
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
              className="grid grid-cols-[minmax(110px,0.7fr)_minmax(0,1.7fr)_auto] items-center gap-4 px-6 py-4 hover:bg-[var(--surface-hover)] transition-colors"
            >
              <span className="font-mono text-sm font-medium text-[var(--text)]">
                {inv.fullNumber}
              </span>
              <div className="min-w-0">
                <span className="block text-sm font-medium text-[var(--text)] truncate">
                  {inv.clientName}
                </span>
                <span className="block text-xs text-[var(--text-subtle)]">
                  {formatDate(inv.issuedAt)}
                </span>
              </div>
              <div className="flex items-center gap-3 justify-end">
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
  );
}
