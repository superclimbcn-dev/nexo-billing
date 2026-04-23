import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type ButtonVariant = 'primary' | 'secondary'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 px-5 py-3 rounded-[10px] text-sm font-semibold cursor-pointer transition-all duration-150 border-0',
        variant === 'primary' &&
          'bg-[var(--accent)] text-black hover:bg-[var(--accent-dim)] hover:-translate-y-px',
        variant === 'secondary' &&
          'bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
