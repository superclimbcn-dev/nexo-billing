import { cn } from '../primitives/cn'

export interface TenantSelectorProps {
  name: string
  nif: string
  sector: string
  initials: string
  className?: string
}

export function TenantSelector({ name, nif, sector, initials, className }: TenantSelectorProps) {
  return (
    <div
      className={cn(
        'p-3 px-3.5 border border-[var(--border)] rounded-[12px] bg-[var(--surface-raised)]',
        'flex items-center gap-2.5 mb-6 cursor-pointer transition-colors duration-150',
        'hover:bg-[var(--surface-hover)]',
        className
      )}
    >
      <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#3a8fef] to-[#1b4fd4] grid place-items-center text-white font-bold text-[13px] flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold truncate">{name}</div>
        <div className="[font-family:var(--font-mono)] text-[10px] text-[var(--text-subtle)]">
          {nif} · {sector}
        </div>
      </div>
      <div className="text-[var(--text-subtle)] text-base">⌄</div>
    </div>
  )
}
