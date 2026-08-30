import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { listSeriesForTenant } from '../_lib/invoice-numbering'
import { InvoiceCreateForm } from '../_components/invoice-create-form'
import { getSubscriptionState } from '@/lib/subscription'

export default async function NuevaFacturaPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true, subscriptionStatus: true, subscriptionExpiresAt: true, trialEndsAt: true },
  })

  if (tenant) {
    const subState = getSubscriptionState(tenant)
    if (subState === 'trial_expired' || subState === 'expired') {
      redirect('/settings/billing?reason=trial_expired')
    }
  }

  const series = await listSeriesForTenant(tenantId)
  const completeInvoiceSeries = series.filter((item) => item.code !== 'FS')

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <header>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Nueva factura
        </h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          Elige factura completa o simplificada según la operación.
        </p>
      </header>
      <InvoiceCreateForm series={completeInvoiceSeries} />
    </div>
  )
}
