import Link from 'next/link'
import { formatDate } from '@nexo/core-utils'
import { QuoteStatusBadge } from './quote-status-badge'
import { QuoteActions } from './quote-actions'

interface Props {
  quote: {
    id: string
    number: string
    status: string
    issuedAt: Date
    validUntil: Date
    invoices: Array<{ id: string; fullNumber: string }>
  }
}

export function QuoteDetailHeader({ quote }: Props) {
  const linkedInvoice = quote.invoices[0] ?? null

  return (
    <header className="space-y-3">
      <Link
        href="/presupuestos"
        className="text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
      >
        ← Volver a presupuestos
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
            {quote.number}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <QuoteStatusBadge status={quote.status} />
            <span className="text-sm text-[var(--text-dim)]">
              Emitido el {formatDate(quote.issuedAt)}
            </span>
            <span className="text-sm text-[var(--text-dim)]">
              · Válido hasta {formatDate(quote.validUntil)}
            </span>
          </div>
          {linkedInvoice && (
            <div className="mt-2">
              <Link
                href={`/facturas/${linkedInvoice.id}`}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                Factura generada: {linkedInvoice.fullNumber} →
              </Link>
            </div>
          )}
        </div>
        <QuoteActions quoteId={quote.id} status={quote.status} invoiceId={linkedInvoice?.id} />
      </div>
    </header>
  )
}
