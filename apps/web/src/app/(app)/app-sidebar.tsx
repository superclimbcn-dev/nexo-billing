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
  userRole?: string | null
  verifactuSentCount?: number
  verifactuLastError?: boolean
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
  userRole,
  verifactuSentCount = 0,
  verifactuLastError = false,
}: AppSidebarProps) {
  const pathname = usePathname()
  const showSettings = userRole !== 'ACCOUNTANT'

  return (
    <Sidebar
      footer={
        <div className="flex flex-col gap-3">
          <ComplianceBadge
            sentCount={verifactuSentCount}
            lastError={verifactuLastError}
          />
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
          href="/presupuestos"
          icon="◫"
          label="Presupuestos"
          active={pathname.startsWith('/presupuestos')}
        />
        <NavItem
          href="/recibos"
          icon="🧾"
          label="Recibos"
          active={pathname.startsWith('/recibos')}
        />
        <NavItem
          href="/recurrentes"
          icon="↻"
          label="Recurrentes"
          active={pathname.startsWith('/recurrentes')}
        />
        <NavItem
          href="/gastos"
          icon="⊟"
          label="Gastos"
          active={pathname.startsWith('/gastos')}
        />
        <NavItem
          href="/tesoreria"
          icon="📊"
          label="Tesorería"
          active={pathname.startsWith('/tesoreria')}
        />
        <NavItem
          href="/impuestos"
          icon="🧮"
          label="Impuestos"
          active={pathname.startsWith('/impuestos')}
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

      {showSettings && (
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
      )}
    </Sidebar>
  )
}
