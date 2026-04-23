import { cn } from '../primitives/cn'

export type DotState = 'done' | 'active' | 'empty'

export interface ProgressDotsProps {
  dots: DotState[]
  className?: string
}

const dotStyles: Record<DotState, string> = {
  done: 'bg-[var(--accent-dim)]',
  active: 'bg-[var(--accent)]',
  empty: 'bg-[var(--surface-raised)]',
}

export function ProgressDots({ dots, className }: ProgressDotsProps) {
  return (
    <div className={cn('flex gap-1.5 mb-12', className)}>
      {dots.map((state, i) => (
        <div key={i} className={cn('flex-1 h-1 rounded-sm', dotStyles[state])} />
      ))}
    </div>
  )
}
