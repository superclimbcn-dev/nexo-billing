import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { AppShell, TopBar } from '@nexo/core-ui'
import { AppSidebar } from './app-sidebar'
import { FileText, TrendingUp, Receipt, Settings } from 'lucide-react'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { vertical: true, branding: true },
  })
  if (!tenant) redirect('/onboarding/cuenta')

  const dbUser = await prisma.user.findFirst({
    where: { id: user.id },
    select: { name: true },
  })

  const userName = dbUser?.name ?? (user.user_metadata?.name as string) ?? user.email ?? ''
  const userRole = user.app_metadata?.role as string | undefined

  // Verifactu status for sidebar
  const verifactuStats = await prisma.invoiceRecord.aggregate({
    where: { tenantId },
    _count: { _all: true },
  })
  const lastVerifactuRecord = await prisma.invoiceRecord.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    select: { status: true },
  })
  const sentCount = verifactuStats._count._all
  const lastError = lastVerifactuRecord?.status === 'error' || lastVerifactuRecord?.status === 'rejected'

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-16 md:pb-0">
      <TopBar
        brand={
          <span className="text-[var(--accent)] text-sm font-mono tracking-widest uppercase">
            Nexo Billing
          </span>
        }
      />
      <AppShell
        className="hidden md:grid"
        sidebar={
          <AppSidebar
            tenantName={tenant.name}
            tenantNif={tenant.nif}
            tenantVertical={tenant.vertical?.name ?? tenant.businessType ?? 'Sector personalizado'}
            userName={userName}
            userEmail={user.email ?? ''}
            userRole={userRole}
            verifactuSentCount={sentCount}
            verifactuLastError={lastError}
          />
        }
      >
        <main className="p-4 md:p-8 overflow-y-auto">{children}</main>
      </AppShell>

      {/* Mobile: full-width content without sidebar */}
      <div className="md:hidden">
        <main className="p-4 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)] border-t border-[var(--border)] md:hidden">
        <div className="grid grid-cols-4 h-16">
          <BottomNavItem href="/facturas" icon={<FileText size={20} />} label="Facturas" />
          <BottomNavItem href="/tesoreria" icon={<TrendingUp size={20} />} label="Tesorería" />
          <BottomNavItem href="/gastos" icon={<Receipt size={20} />} label="Gastos" />
          <BottomNavItem href="/settings" icon={<Settings size={20} />} label="Ajustes" />
        </div>
      </nav>
    </div>
  )
}

function BottomNavItem({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 text-[var(--text-dim)] hover:text-[var(--text)] active:text-[var(--accent)] transition-colors"
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}
