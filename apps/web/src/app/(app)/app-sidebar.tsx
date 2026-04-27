'use client'

import { usePathname } from 'next/navigation'
import {
  Sidebar,
  NavItem,
  NavSectionLabel,
  TenantSelector,
  ComplianceBadge,
} from '@nexo/core-ui'
import { signOutAction } from '@/actions/auth'

interface AppSidebarProps {
  tenantName: string
  tenantNif: string
  tenantVertical: string
  userName: string
  userEmail: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function AppSidebar({
  tenantName,
  tenantNif,
  tenantVertical,
  userName,
  userEmail,
}: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar
      footer={
        <div className="flex flex-col gap-3">
          <ComplianceBadge />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-[var(--text)] font-medium truncate">{userName}</span>
            <span className="text-[11px] text-[var(--text-subtle)] truncate">{userEmail}</span>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-xs text-[var(--text-subtle)] hover:text-[var(--danger)] transition-colors cursor-pointer"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      }
    >
      <TenantSelector
        name={tenantName}
        nif={tenantNif}
        sector={tenantVertical}
        initials={getInitials(tenantName)}
      />

      <div className="mt-4 flex flex-col gap-0.5">
        <NavItem
          href="/dashboard"
          icon="◈"
          label="Dashboard"
          active={pathname === '/dashboard'}
        />
        <NavItem
          href="/facturas"
          icon="◻"
          label="Facturas"
          active={pathname.startsWith('/facturas')}
        />
        <NavItem
          href="/clientes"
          icon="◎"
          label="Clientes"
          active={pathname.startsWith('/clientes')}
        />
        <NavItem
          href="/productos"
          icon="⊞"
          label="Productos"
          active={pathname.startsWith('/productos')}
        />
      </div>

      <div className="mt-4 flex flex-col gap-0.5">
        <NavSectionLabel>Configuración</NavSectionLabel>
        <NavItem
          href="/settings/team"
          icon="⊙"
          label="Equipo"
          active={pathname.startsWith('/settings/team')}
        />
        <NavItem
          href="/settings"
          icon="⚙"
          label="Ajustes"
          active={pathname === '/settings'}
        />
      </div>
    </Sidebar>
  )
}
