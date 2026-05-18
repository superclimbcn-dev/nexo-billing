export type SubscriptionState =
  | 'trial_active'
  | 'trial_expired'
  | 'active'
  | 'cancelled'
  | 'expired'

export interface SubscriptionTenant {
  plan: string
  subscriptionStatus: string | null
  subscriptionExpiresAt: Date | null
  trialEndsAt: Date | null
}

export function getSubscriptionState(tenant: SubscriptionTenant): SubscriptionState {
  const now = new Date()

  if (tenant.subscriptionStatus === 'ACTIVE') return 'active'

  if (tenant.subscriptionStatus === 'CANCELLED') {
    if (tenant.subscriptionExpiresAt && tenant.subscriptionExpiresAt > now) return 'cancelled'
    return 'expired'
  }

  if (tenant.trialEndsAt) {
    if (tenant.trialEndsAt > now) return 'trial_active'
    return 'trial_expired'
  }

  return 'expired'
}

export function getTrialDaysLeft(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0
  const diff = trialEndsAt.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
