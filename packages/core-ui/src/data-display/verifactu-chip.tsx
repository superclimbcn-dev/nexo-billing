import { cn } from '../primitives/cn'

export interface VerifactuChipProps {
  className?: string
  status?: 'sent' | 'pending' | 'error' | 'none'
}

export function VerifactuChip({ className, status = 'none' }: VerifactuChipProps) {
  if (status === 'none' || status === 'pending') return null

  const isError = status === 'error'
  const label = isError ? '⚠ AEAT' : '✓ AEAT'
  const colorClass = isError
    ? 'text-[var(--danger)] bg-[rgba(239,68,68,0.08)]'
    : 'text-[var(--accent)] bg-[rgba(212,255,63,0.08)]'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] [font-family:var(--font-mono)]',
        'px-1.5 py-[3px] rounded-[4px] tracking-[0.04em]',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}
