import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { TopBar, ScreenSwitcher } from '@nexo/core-ui'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

const SCREENS = [
  { label: 'Dashboard', href: '/spoiler' },
  { label: 'Nueva factura', href: '/spoiler/crear' },
  { label: 'App móvil', href: '/spoiler/movil' },
  { label: 'Onboarding', href: '/spoiler/onboarding' },
]

const Brand = () => (
  <div className="flex items-center gap-3 [font-family:var(--font-serif)] text-[22px] tracking-[-0.01em]">
    <div className="w-7 h-7 bg-[var(--accent)] rounded-[8px] grid place-items-center text-black [font-family:var(--font-sans)] font-bold text-sm shadow-[0_0_24px_var(--accent-glow)]">
      N
    </div>
    <div>
      Nexo Billing{' '}
      <em className="italic text-[var(--text-dim)] text-base">— spoiler</em>
    </div>
  </div>
)

const Meta = () => (
  <div className="[font-family:var(--font-mono)] text-[11px] text-[var(--text-subtle)] tracking-[0.04em] uppercase">
    v0.1 · prototipo
  </div>
)

export default function SpoilerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopBar
        brand={<Brand />}
        switcher={<ScreenSwitcher screens={SCREENS} />}
        meta={<Meta />}
      />
      {children}
    </>
  )
}
