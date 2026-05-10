import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { AppShell, TopBar } from '@nexo/core-ui'
import { AppSidebar } from './app-sidebar'

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
    <div className="min-h-screen bg-[var(--bg)]">
      <TopBar
        brand={
          <span className="text-[var(--accent)] text-sm font-mono tracking-widest uppercase">
            Nexo Billing
          </span>
        }
      />
      <AppShell
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
        <main className="p-8 overflow-y-auto">{children}</main>
      </AppShell>
    </div>
  )
}
