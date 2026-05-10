import { redirect } from 'next/navigation'
import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { BillingCard } from '../_components/billing-card'

export default async function BillingPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      goCardlessMandateId: true,
      goCardlessCustomerId: true,
    },
  })

  if (!tenant) redirect('/onboarding/cuenta')

  return (
    <div className="space-y-6">
      <BillingCard tenant={tenant} />
    </div>
  )
}
