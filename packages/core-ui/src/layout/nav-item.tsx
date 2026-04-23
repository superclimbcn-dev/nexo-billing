import type { ReactNode } from 'react'
import { cn } from '../primitives/cn'

export interface NavItemProps {
  icon: ReactNode
  label: string
  badge?: number | string
  active?: boolean
  href?: string
  className?: string
}

export function NavItem({ icon, label, badge, active, href, className }: NavItemProps) {
  const Tag = href ? 'a' : ('div' as 'a' | 'div')
  return (
    <Tag
      href={href}
      className={cn(
        'flex items-center gap-3 px-3.5 py-[9px] rounded-[10px] text-[var(--text-dim)] text-sm cursor-pointer transition-all duration-150 no-underline',
        'hover:bg-[var(--surface-hover)] hover:text-[var(--text)]',
        active && 'bg-[var(--surface-raised)] text-[var(--text)]',
        className
      )}
    >
      <span
        className={cn(
          'w-[18px] inline-grid place-items-center text-[var(--text-subtle)]',
          active && 'text-[var(--accent)]'
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
      {badge !== undefined && (
        <span className="ml-auto bg-[var(--accent)] text-black text-[10px] px-1.5 py-0.5 rounded-[6px] font-bold [font-family:var(--font-mono)]">
          {badge}
        </span>
      )}
    </Tag>
  )
}
