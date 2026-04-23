import { cn } from '../primitives/cn'

export interface ComplianceBadgeProps {
  className?: string
}

export function ComplianceBadge({ className }: ComplianceBadgeProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-[rgba(212,255,63,0.1)] to-[rgba(212,255,63,0.02)]',
        'border border-[rgba(212,255,63,0.25)] rounded-[10px] p-2.5 px-3 text-[11px]',
        'flex items-center gap-2',
        className
      )}
    >
      <div className="w-2 h-2 bg-[var(--accent)] rounded-full shadow-[0_0_12px_var(--accent)] animate-nexo-pulse flex-shrink-0" />
      <div>
        <div className="font-semibold text-[var(--accent)]">VERI·FACTU</div>
        <div className="text-[var(--text-subtle)]">Activo · SIF certificado</div>
      </div>
    </div>
  )
}
