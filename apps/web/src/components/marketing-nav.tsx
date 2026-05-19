'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const MAIN_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/#funciones', label: 'Funciones' },
  { href: '/precios', label: 'Precios' },
  { href: '/faq', label: 'FAQ' },
  { href: '/blog', label: 'Blog' },
  { href: '/sobre-nosotros', label: 'Sobre nosotros' },
  { href: '/contacto', label: 'Contacto' },
]

export function MarketingNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header className="border-b border-[var(--border)] relative z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-[var(--accent)]">Nexo</span> Billing
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--text-dim)]">
            <a href="/#funciones" className="hover:text-[var(--text)] transition-colors">
              Funciones
            </a>
            <Link href="/precios" className="hover:text-[var(--text)] transition-colors">
              Precios
            </Link>
            <Link href="/faq" className="hover:text-[var(--text)] transition-colors">
              FAQ
            </Link>
            <Link href="/blog" className="hover:text-[var(--text)] transition-colors">
              Blog
            </Link>
            <Link href="/sobre-nosotros" className="hover:text-[var(--text)] transition-colors">
              Sobre nosotros
            </Link>
            <a
              href="mailto:contacto@nexo-digital.app"
              className="hover:text-[var(--text)] transition-colors"
            >
              Contacto
            </a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 border border-[var(--border)] text-[var(--text-dim)] text-sm rounded-md hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors"
            >
              Acceder
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] text-sm font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors"
            >
              Empezar gratis
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 text-[var(--text)] rounded-md hover:bg-[var(--surface)] transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
          >
            <span
              className="transition-transform duration-150"
              style={{ display: 'grid', placeItems: 'center' }}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" aria-modal="true" role="dialog">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-down panel */}
          <div className="marketing-nav-panel absolute inset-x-0 top-0 bg-[#0a0a0a] shadow-2xl">
            {/* Panel header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2"
              >
                <span className="text-xl font-bold tracking-tight">
                  <span className="text-[#CBFF4D]">Nexo</span> Billing
                </span>
              </Link>
              <button
                className="flex items-center justify-center w-10 h-10 text-white rounded-md hover:bg-white/10 transition-colors"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
              >
                <X size={22} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col px-4 py-2">
              {MAIN_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center min-h-[52px] text-white/70 text-[1.0625rem] font-medium border-b border-white/8 hover:text-white transition-colors"
                >
                  {label}
                </Link>
              ))}

              {/* CTAs */}
              <div className="mt-6 mb-8 flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center h-12 border border-white/20 text-white text-sm font-medium rounded-lg hover:border-white/40 transition-colors"
                >
                  Acceder
                </Link>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center h-12 bg-[#CBFF4D] text-black text-sm font-semibold rounded-lg hover:bg-[#b8f040] transition-colors"
                >
                  Empezar gratis →
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
