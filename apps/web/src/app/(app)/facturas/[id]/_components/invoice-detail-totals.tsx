import { formatCurrency } from '@nexo/core-utils'
import { calculateInvoiceTotals } from '../../_lib/invoice-totals'
import type { Prisma } from '@nexo/prisma'

type DecimalLike = Prisma.Decimal | number

function toNum(v: DecimalLike): number {
  if (typeof v === 'number') return v
  return parseFloat(v.toString())
}

interface Props {
  invoice: {
    subtotal: DecimalLike
    vatAmount: DecimalLike
    totalAmount: DecimalLike
    lines: Array<{
      quantity: DecimalLike
      unitPrice: DecimalLike
      vatRate: DecimalLike
    }>
  }
}

export function InvoiceDetailTotals({ invoice }: Props) {
  const totals = calculateInvoiceTotals(
    invoice.lines.map((l) => ({
      quantity: toNum(l.quantity),
      unitPrice: toNum(l.unitPrice),
      vatRate: toNum(l.vatRate),
    })),
  )

  return (
    <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-3">
      <h3 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide">
        Resumen
      </h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--text-dim)]">Subtotal</span>
          <span className="font-mono">{formatCurrency(toNum(invoice.subtotal))}</span>
        </div>

        {totals.vatBreakdown.length > 0 && (
          <div className="space-y-1 border-t border-[var(--border)] pt-2">
            {totals.vatBreakdown.map((b) => (
              <div key={b.rate} className="flex justify-between text-xs">
                <span className="text-[var(--text-dim)]">
                  IVA {b.rate}% s/{formatCurrency(b.base)}
                </span>
                <span className="font-mono text-[var(--text-dim)]">
                  {formatCurrency(b.amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between border-t border-[var(--border)] pt-2">
          <span className="text-[var(--text-dim)]">Total IVA</span>
          <span className="font-mono">{formatCurrency(toNum(invoice.vatAmount))}</span>
        </div>

        <div className="flex justify-between text-lg font-medium border-t-2 border-[var(--border-strong)] pt-2">
          <span>Total</span>
          <span className="font-mono text-[var(--accent)]">
            {formatCurrency(toNum(invoice.totalAmount))}
          </span>
        </div>
      </div>
    </div>
  )
}
