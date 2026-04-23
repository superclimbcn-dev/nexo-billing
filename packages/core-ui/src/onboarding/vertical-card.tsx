import { cn } from '../primitives/cn'

export interface VerticalCardProps {
  icon: string
  title: string
  description: string
  selected?: boolean
  className?: string
}

export function VerticalCard({
  icon,
  title,
  description,
  selected = false,
  className,
}: VerticalCardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-6 cursor-pointer transition-all duration-200 relative overflow-hidden',
        'hover:border-[var(--border-strong)] hover:-translate-y-0.5',
        selected &&
          'border-[var(--accent)] bg-gradient-to-br from-[var(--surface)] to-[rgba(212,255,63,0.05)]',
        className
      )}
    >
      {selected && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-[var(--accent)] text-black rounded-full grid place-items-center text-sm font-bold">
          ✓
        </div>
      )}
      <div
        className={cn(
          'w-11 h-11 bg-[var(--surface-raised)] rounded-[12px] grid place-items-center text-xl mb-3.5',
          selected && 'bg-[var(--accent)] text-black'
        )}
      >
        {icon}
      </div>
      <div className="text-base font-semibold mb-1">{title}</div>
      <div className="text-xs text-[var(--text-dim)] leading-relaxed">{description}</div>
    </div>
  )
}
