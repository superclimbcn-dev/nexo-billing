import type { ReactNode } from 'react'
import { cn } from '../primitives/cn'

export interface PhoneFrameProps {
  children: ReactNode
  className?: string
}

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      className={cn(
        'w-[380px] h-[780px] bg-black border-[8px] border-[#1a1a1a] rounded-[48px] p-2',
        'shadow-[0_40px_80px_rgba(0,0,0,0.5)] relative flex-shrink-0',
        className
      )}
    >
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[110px] h-[26px] bg-black rounded-[20px] z-10" />
      <div
        className="w-full h-full bg-[var(--bg)] rounded-[40px] overflow-hidden pt-10 px-5 pb-5 relative flex flex-col"
      >
        {children}
      </div>
    </div>
  )
}
