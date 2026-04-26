'use client'

import { usePathname } from 'next/navigation'
import { ProgressDots } from '@nexo/core-ui'
import type { DotState } from '@nexo/core-ui'

const STEPS = [
  '/onboarding/cuenta',
  '/onboarding/empresa',
  '/onboarding/datos-fiscales',
  '/onboarding/vertical',
  '/onboarding/configuracion',
]

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentIndex = STEPS.findIndex((s) => pathname.startsWith(s))

  const dots: DotState[] = STEPS.map((_, i) => {
    if (i < currentIndex) return 'done'
    if (i === currentIndex) return 'active'
    return 'empty'
  })

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[640px]">
        <div className="text-center mb-8">
          <span className="text-[var(--accent)] text-sm font-mono tracking-widest uppercase">
            Nexo Billing
          </span>
        </div>
        <ProgressDots dots={dots} className="mb-10" />
        {children}
      </div>
    </div>
  )
}
