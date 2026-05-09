import { cn } from '../primitives/cn'
import { ClientAvatar } from './client-avatar'
import { StatusChip } from './status-chip'
import { VerifactuChip } from './verifactu-chip'
import type { StatusType } from './status-chip'

export type { StatusType }

export interface InvoiceRowProps {
  number: string
  clientName: string
  clientMeta: string
  clientAvatar: { initials: string; gradient: string }
  amount: string
  status: StatusType
  statusLabel: string
  verifactuStatus?: 'sent' | 'pending' | 'error' | 'none'
  className?: string
}

export function InvoiceRow({
  number,
  clientName,
  clientMeta,
  clientAvatar,
  amount,
  status,
  statusLabel,
  verifactuStatus = 'none',
  className,
}: InvoiceRowProps) {
  return (
    <div
      className={cn(
        'grid gap-4 px-6 py-4 border-b border-[var(--border)] items-center',
        'transition-colors duration-100 cursor-pointer',
        'hover:bg-[var(--surface-hover)]',
        'last:border-b-0',
        '[grid-template-columns:120px_1fr_auto_auto_auto]',
        className
      )}
    >
      <div className="[font-family:var(--font-mono)] text-xs text-[var(--text-dim)]">{number}</div>
      <div className="flex items-center gap-3">
        <ClientAvatar {...clientAvatar} />
        <div>
          <div className="text-sm font-medium">{clientName}</div>
          <div className="text-[11px] text-[var(--text-subtle)] [font-family:var(--font-mono)]">
            {clientMeta}
          </div>
        </div>
      </div>
      <div className="[font-family:var(--font-serif)] text-[18px] font-normal tracking-[-0.01em]">
        {amount}
      </div>
      <StatusChip status={status} label={statusLabel} />
      <VerifactuChip status={verifactuStatus} />
    </div>
  )
}
