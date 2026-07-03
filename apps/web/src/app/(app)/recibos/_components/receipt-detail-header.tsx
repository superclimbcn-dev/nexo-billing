import Link from 'next/link'
import { formatDate } from '@nexo/core-utils'
import { ReceiptStatusBadge } from './receipt-status-badge'
import { ReceiptActions } from './receipt-actions'

interface Props {
  receipt: {
    id: string
    number: string
    status: string
    issuedAt: Date
  }
}

export function ReceiptDetailHeader({ receipt }: Props) {
  return (
    <header className="space-y-3">
      <Link
        href="/recibos"
        className="text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
      >
        ← Volver a recibos
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
            {receipt.number}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <ReceiptStatusBadge status={receipt.status} />
            <span className="text-sm text-[var(--text-dim)]">
              Emitido el {formatDate(receipt.issuedAt)}
            </span>
          </div>
        </div>
        <ReceiptActions receiptId={receipt.id} status={receipt.status} />
      </div>
    </header>
  )
}
