'use server'

import { prisma } from '@nexo/prisma'
import { requireOwnerOrAdminAction } from '@/lib/auth/role-guard'
import { revalidatePath } from 'next/cache'
import gocardless, { Environments } from 'gocardless-nodejs'
import { SubscriptionIntervalUnit, PaymentCurrency } from 'gocardless-nodejs/types/Types'
import { sendInternalAlert } from '@/lib/internal-alerts'
import { activateVerifactuForTenant } from '@/lib/verifactu/activate'

// ── Types ───────────────────────────────────────────────────────────────────

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string }

// ── GoCardless client ───────────────────────────────────────────────────────

function getGoCardlessClient() {
  const token = process.env.GOCARDLESS_ACCESS_TOKEN
  const env = process.env.GOCARDLESS_ENVIRONMENT
  console.log(`[gocardless] environment=${env ?? 'sandbox (default)'} token_set=${!!token}`)
  if (!token) throw new Error('GOCARDLESS_ACCESS_TOKEN not configured')
  return gocardless(token, env === 'live' ? Environments.Live : Environments.Sandbox)
}

function serializeGcError(err: unknown): string {
  const detail: Record<string, unknown> = {}
  if (err instanceof Error) {
    detail.message = err.message
    detail.name = err.name
  }
  const rec = err as Record<string, unknown>
  if (rec.response) detail.response = rec.response
  if (rec.error) detail.error = rec.error
  if (rec.statusCode) detail.statusCode = rec.statusCode
  if (!Object.keys(detail).length) detail.raw = String(err)
  return JSON.stringify(detail, null, 2)
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const SUBSCRIPTION_AMOUNT_CENTS = 3900 // 39.00 €
const SUBSCRIPTION_CURRENCY = 'EUR'

// ── Create mandate (RedirectFlow) ───────────────────────────────────────────

export async function createGoCardlessMandate(): Promise<ActionResult<{ redirectUrl: string }>> {
  const ctx = await requireOwnerOrAdminAction()
  if (!ctx) return { ok: false, error: 'No tienes permiso' }

  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      goCardlessMandateId: true,
    },
  })
  if (!tenant) return { ok: false, error: 'Tenant no encontrado' }
  if (tenant.goCardlessMandateId) {
    return { ok: false, error: 'Ya tienes una autorización SEPA activa' }
  }

  try {
    const gc = getGoCardlessClient()

    // Deterministic token — must stay stable so confirmGoCardlessMandate can reproduce it
    const sessionToken = `sess_${tenant.id}`

    const flowRes = await gc.redirectFlows.create({
      session_token: sessionToken,
      success_redirect_url: `${APP_URL}/settings/billing?gc=success`,
      prefilled_customer: {
        company_name: tenant.name,
        email: tenant.email ?? null,
        country_code: 'ES',
      },
    })

    const redirectUrl = flowRes.redirect_url
    if (!redirectUrl) {
      return { ok: false, error: 'Error al crear flujo de autorización' }
    }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { subscriptionStatus: 'PENDING' },
    })

    return { ok: true, data: { redirectUrl } }
  } catch (err) {
    console.error('[GOCARDLESS ERROR] createGoCardlessMandate:', serializeGcError(err))
    await sendInternalAlert({
      title: 'Error al iniciar autorización SEPA',
      stage: 'gocardless.create_mandate',
      severity: 'error',
      tenant: { id: tenant.id, name: tenant.name },
      error: err,
    })
    return { ok: false, error: 'Error al iniciar autorización SEPA' }
  }
}

// ── Confirm mandate + create subscription ───────────────────────────────────

export async function confirmGoCardlessMandate(redirectFlowId: string): Promise<ActionResult> {
  const ctx = await requireOwnerOrAdminAction()
  if (!ctx) return { ok: false, error: 'No tienes permiso' }

  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: {
      id: true,
      name: true,
      legalName: true,
      nif: true,
      goCardlessCustomerId: true,
      goCardlessMandateId: true,
    },
  })
  if (!tenant) return { ok: false, error: 'Tenant no encontrado' }
  if (tenant.goCardlessMandateId) {
    return { ok: false, error: 'Mandato ya activo' }
  }

  try {
    const gc = getGoCardlessClient()

    // Must use the same deterministic token as createGoCardlessMandate
    const flowRes = await gc.redirectFlows.complete(redirectFlowId, {
      session_token: `sess_${tenant.id}`,
    })

    const mandateId = flowRes.links?.mandate
    if (!mandateId) {
      return { ok: false, error: 'No se pudo completar la autorización' }
    }

    // Create subscription (monthly)
    const subRes = await gc.subscriptions.create({
      amount: String(SUBSCRIPTION_AMOUNT_CENTS),
      currency: PaymentCurrency.EUR,
      interval_unit: SubscriptionIntervalUnit.Monthly,
      name: 'Nexo Billing Profesional',
      links: { mandate: mandateId },
    })

    const subscriptionId = subRes.id
    if (!subscriptionId) {
      return { ok: false, error: 'No se pudo crear la suscripción' }
    }

    // Update tenant
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        goCardlessMandateId: mandateId,
        goCardlessSubscriptionId: subscriptionId,
        subscriptionStatus: 'ACTIVE',
      },
    })

    await activateVerifactuForTenant({
      id: tenant.id,
      nif: tenant.nif,
      legalName: tenant.legalName,
      name: tenant.name,
    })

    revalidatePath('/settings/billing')
    return { ok: true, data: undefined }
  } catch (err) {
    console.error('[GOCARDLESS ERROR] confirmGoCardlessMandate:', serializeGcError(err))
    await sendInternalAlert({
      title: 'Error al confirmar autorización SEPA',
      stage: 'gocardless.confirm_mandate',
      severity: 'critical',
      tenant: { id: tenant.id, name: tenant.legalName ?? tenant.name, nif: tenant.nif },
      event: { redirectFlowId },
      error: err,
    })
    return { ok: false, error: 'Error al confirmar autorización SEPA' }
  }
}

// ── Create one-off payment ──────────────────────────────────────────────────

export async function createGoCardlessPayment(): Promise<ActionResult> {
  const ctx = await requireOwnerOrAdminAction()
  if (!ctx) return { ok: false, error: 'No tienes permiso' }

  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: {
      id: true,
      name: true,
      legalName: true,
      nif: true,
      goCardlessMandateId: true,
    },
  })
  if (!tenant) return { ok: false, error: 'Tenant no encontrado' }
  if (!tenant.goCardlessMandateId) {
    return { ok: false, error: 'No hay mandato SEPA activo' }
  }

  try {
    const gc = getGoCardlessClient()

    await gc.payments.create({
      amount: String(SUBSCRIPTION_AMOUNT_CENTS),
      currency: PaymentCurrency.EUR,
      charge_date: undefined, // GoCardless picks earliest available
      description: 'Nexo Billing - Suscripción mensual',
      links: { mandate: tenant.goCardlessMandateId },
    })

    revalidatePath('/settings/billing')
    return { ok: true, data: undefined }
  } catch (err) {
    console.error('[GOCARDLESS ERROR] createGoCardlessPayment:', serializeGcError(err))
    await sendInternalAlert({
      title: 'Error al crear cobro SEPA',
      stage: 'gocardless.create_payment',
      severity: 'critical',
      tenant: { id: tenant.id, name: tenant.legalName ?? tenant.name, nif: tenant.nif },
      error: err,
    })
    return { ok: false, error: 'Error al crear cobro SEPA' }
  }
}

// ── Cancel subscription ─────────────────────────────────────────────────────

export async function cancelGoCardlessSubscription(): Promise<ActionResult> {
  const ctx = await requireOwnerOrAdminAction()
  if (!ctx) return { ok: false, error: 'No tienes permiso' }

  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: {
      id: true,
      name: true,
      legalName: true,
      nif: true,
      goCardlessSubscriptionId: true,
    },
  })
  if (!tenant) return { ok: false, error: 'Tenant no encontrado' }
  if (!tenant.goCardlessSubscriptionId) {
    return { ok: false, error: 'No hay suscripción activa' }
  }

  try {
    const gc = getGoCardlessClient()
    await gc.subscriptions.cancel(tenant.goCardlessSubscriptionId, {})

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: 'CANCELLED',
        subscriptionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias grace
      },
    })

    revalidatePath('/settings/billing')
    return { ok: true, data: undefined }
  } catch (err) {
    console.error('[GOCARDLESS ERROR] cancelGoCardlessSubscription:', serializeGcError(err))
    await sendInternalAlert({
      title: 'Error al cancelar suscripción SEPA',
      stage: 'gocardless.cancel_subscription',
      severity: 'error',
      tenant: { id: tenant.id, name: tenant.legalName ?? tenant.name, nif: tenant.nif },
      error: err,
    })
    return { ok: false, error: 'Error al cancelar suscripción' }
  }
}
