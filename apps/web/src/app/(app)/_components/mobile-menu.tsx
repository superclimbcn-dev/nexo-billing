'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Receipt,
  Users,
  Package,
  Calculator,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/facturas', icon: FileText, label: 'Facturas' },
  { href: '/tesoreria', icon: TrendingUp, label: 'Tesorería' },
  { href: '/gastos', icon: Receipt, label: 'Gastos' },
  { href: '/clientes', icon: Users, label: 'Clientes' },
  { href: '/productos', icon: Package, label: 'Productos' },
  { href: '/impuestos', icon: Calculator, label: 'Impuestos' },
  { href: '/settings', icon: Settings, label: 'Ajustes' },
]

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isOpen) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  async function handleLogout() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await supabase.auth.signOut()
    router.push('/login')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute top-0 left-0 h-full w-[280px] bg-[var(--surface)] border-r border-[var(--border)] shadow-2xl flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--border)]">
          <span className="text-[var(--accent)] text-xs font-mono tracking-widest uppercase">
            Nexo Billing
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? 'text-[var(--accent)] bg-[var(--accent)]/10 border-r-2 border-[var(--accent)]'
                    : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--bg)]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer: Logout */}
        <div className="border-t border-[var(--border)] p-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  )
}
