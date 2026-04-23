import type { ReactNode } from 'react'
import { cn } from '../primitives/cn'

export interface WhatsappPromoCardProps {
  title?: ReactNode
  description?: string
  buttonLabel?: string
  className?: string
}

export function WhatsappPromoCard({
  title,
  description,
  buttonLabel = '◆ Conectar WhatsApp',
  className,
}: WhatsappPromoCardProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-[14px] p-5 text-white mb-4 relative overflow-hidden',
        className
      )}
    >
      <div className="absolute -top-8 -right-8 w-[120px] h-[120px] bg-white/10 rounded-full pointer-events-none" />
      {title && (
        <h3 className="[font-family:var(--font-serif)] text-2xl font-normal italic mb-1.5 relative">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-xs opacity-90 mb-3 relative">{description}</p>
      )}
      <button className="bg-white/25 backdrop-blur-[8px] text-white border border-white/30 px-3.5 py-2 rounded-[8px] text-xs font-medium cursor-pointer relative inline-flex items-center gap-1.5">
        {buttonLabel}
      </button>
    </div>
  )
}
