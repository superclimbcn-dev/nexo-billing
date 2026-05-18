import { prisma } from '@nexo/prisma'
import { getSubscriptionState } from './subscription'

export async function checkCanCreateInvoice(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      plan: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      trialEndsAt: true,
    },
  })

  if (!tenant) return false

  const state = getSubscriptionState(tenant)
  return state === 'trial_active' || state === 'active' || state === 'cancelled'
}
