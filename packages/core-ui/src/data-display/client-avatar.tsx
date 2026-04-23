import { cn } from '../primitives/cn'

export interface ClientAvatarProps {
  initials: string
  gradient: string
  size?: number
  className?: string
}

export function ClientAvatar({ initials, gradient, size = 32, className }: ClientAvatarProps) {
  return (
    <div
      className={cn(
        'rounded-[8px] grid place-items-center text-white font-semibold text-xs flex-shrink-0',
        className
      )}
      style={{ background: gradient, width: size, height: size }}
    >
      {initials}
    </div>
  )
}
