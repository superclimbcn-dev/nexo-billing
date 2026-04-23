import type { ReactNode } from 'react'
import { cn } from '../primitives/cn'

export interface PhoneActionCardProps {
  icon: ReactNode
  label: string
  done?: boolean
  className?: string
}

export function PhoneActionCard({ icon, label, done = false, className }: PhoneActionCardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-4 px-3 text-center cursor-pointer',
        done && 'border-[var(--success)] text-[var(--success)]',
        className
      )}
    >
      <div className="text-2xl mb-1.5">{icon}</div>
      <div
        className={cn(
          'text-[11px] text-[var(--text-dim)]',
          done && 'text-[var(--success)] font-medium'
        )}
      >
        {label}
      </div>
    </div>
  )
}
