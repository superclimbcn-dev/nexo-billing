import { cn } from '../primitives/cn'

export interface VerifactuChipProps {
  className?: string
}

export function VerifactuChip({ className }: VerifactuChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] [font-family:var(--font-mono)] text-[var(--accent)]',
        'bg-[rgba(212,255,63,0.08)] px-1.5 py-[3px] rounded-[4px] tracking-[0.04em]',
        className
      )}
    >
      ✓ AEAT
    </span>
  )
}
