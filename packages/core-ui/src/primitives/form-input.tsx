import type { InputHTMLAttributes } from 'react'
import { cn } from './cn'

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function FormInput({ label, className, id, ...props }: FormInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs text-[var(--text-dim)]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-[var(--text)] text-sm outline-none transition-colors duration-150',
          'focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]',
          className
        )}
        {...props}
      />
    </div>
  )
}
