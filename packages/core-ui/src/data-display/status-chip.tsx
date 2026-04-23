import { cn } from '../primitives/cn'

export type StatusType = 'paid' | 'pending' | 'overdue' | 'sent'

export interface StatusChipProps {
  status: StatusType
  label: string
  className?: string
}

const statusStyles: Record<StatusType, string> = {
  paid: 'bg-[rgba(74,222,128,0.15)] text-[var(--success)]',
  pending: 'bg-[rgba(251,191,36,0.15)] text-[var(--warning)]',
  overdue: 'bg-[rgba(248,113,113,0.15)] text-[var(--danger)]',
  sent: 'bg-[rgba(161,161,170,0.15)] text-[var(--text-dim)]',
}

export function StatusChip({ status, label, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        'text-[11px] px-2.5 py-1 rounded-[6px] font-medium tracking-[0.02em]',
        statusStyles[status],
        className
      )}
    >
      {label}
    </span>
  )
}
