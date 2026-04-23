import type { ReactNode } from 'react'
import { cn } from '../primitives/cn'

export type KpiDeltaVariant = 'up' | 'down' | 'neutral'

export interface KpiCardProps {
  label: string
  value: string
  unit?: string
  delta: ReactNode
  deltaVariant?: KpiDeltaVariant
  featured?: boolean
  sparkPath?: string
  className?: string
}

const deltaColors: Record<KpiDeltaVariant, string> = {
  up: 'text-[var(--success)]',
  down: 'text-[var(--danger)]',
  neutral: 'text-[var(--text-dim)]',
}

export function KpiCard({
  label,
  value,
  unit,
  delta,
  deltaVariant = 'up',
  featured = false,
  sparkPath,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'border border-[var(--border)] rounded-[14px] p-5 relative overflow-hidden transition-colors duration-200',
        'hover:border-[var(--border-strong)]',
        featured
          ? 'bg-gradient-to-br from-[var(--surface)] to-[rgba(212,255,63,0.04)] border-[rgba(212,255,63,0.2)]'
          : 'bg-[var(--surface)]',
        className
      )}
    >
      <div className="[font-family:var(--font-mono)] text-[11px] text-[var(--text-subtle)] uppercase tracking-[0.06em] mb-3">
        {label}
      </div>
      <div className="[font-family:var(--font-serif)] text-[42px] font-normal tracking-[-0.02em] leading-none mb-2">
        {value}
        {unit && <span className="text-[20px] text-[var(--text-dim)] ml-0.5">{unit}</span>}
      </div>
      <div className={cn('text-xs flex items-center gap-1', deltaColors[deltaVariant])}>
        {delta}
      </div>
      {sparkPath && (
        <svg
          className="absolute right-5 bottom-5 opacity-50"
          width="80"
          height="32"
          viewBox="0 0 80 32"
          aria-hidden="true"
        >
          <path d={sparkPath} stroke="var(--accent)" strokeWidth="1.5" fill="none" />
        </svg>
      )}
    </div>
  )
}
