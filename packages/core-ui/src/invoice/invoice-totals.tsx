import { cn } from '../primitives/cn'

export interface InvoiceTotalsProps {
  base: string
  vatLabel: string
  vatAmount: string
  total: string
  className?: string
}

export function InvoiceTotals({ base, vatLabel, vatAmount, total, className }: InvoiceTotalsProps) {
  return (
    <div className={cn('mt-5 bg-[var(--bg)] rounded-[12px] p-5', className)}>
      <div className="flex justify-between py-2 text-[13px] text-[var(--text-dim)]">
        <span>Base imponible</span>
        <span className="[font-family:var(--font-mono)]">{base}</span>
      </div>
      <div className="flex justify-between py-2 text-[13px] text-[var(--text-dim)]">
        <span>{vatLabel}</span>
        <span className="[font-family:var(--font-mono)]">{vatAmount}</span>
      </div>
      <div className="flex justify-between items-baseline border-t border-[var(--border)] mt-2 pt-4 [font-family:var(--font-serif)] text-[28px] text-[var(--text)]">
        <span className="text-[var(--text-dim)] text-sm">Total</span>
        <span>{total}</span>
      </div>
    </div>
  )
}
