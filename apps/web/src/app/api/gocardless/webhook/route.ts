import { NextResponse } from 'next/server'
import { parse } from 'gocardless-nodejs'
import { prisma } from '@nexo/prisma'
import type { Event } from 'gocardless-nodejs/types/Types'
import { activateVerifactuForTenant } from '@/lib/verifactu/activate'
import { sendInternalAlert } from '@/lib/internal-alerts'

const WEBHOOK_SECRET = process.env.GOCARDLESS_WEBHOOK_SECRET

export async function POST(request: Request): Promise<Response> {
  if (!WEBHOOK_SECRET) {
    console.error('[gocardless-webhook] GOCARDLESS_WEBHOOK_SECRET not configured')
    await sendInternalAlert({
      title: 'GOCARDLESS_WEBHOOK_SECRET no está configurado',
      stage: 'gocardless.webhook.missing_secret',
      severity: 'critical',
    })
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const signature = request.headers.get('Webhook-Signature') ?? ''
  const body = await request.text()

  let events: Event[]
  try {
    events = parse(body, WEBHOOK_SECRET, signature)
  } catch {
    console.error('[gocardless-webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Respond 200 immediately — process in background
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  processEvents(events)

  return NextResponse.json({ received: true })
}

async function processEvents(events: Event[]): Promise<void> {
  for (const event of events) {
    const action = event.action ?? ''
    const resourceType = event.resource_type ?? ''

    console.log(`[gocardless-webhook] ${resourceType}.${action} — id=${event.id}`)

    try {
      switch (resourceType) {
        case 'payments':
          await handlePaymentEvent(action, event)
          break
        case 'subscriptions':
          await handleSubscriptionEvent(action, event)
          break
        case 'mandates':
          await handleMandateEvent(action, event)
          break
        default:
          console.log(`[gocardless-webhook] Ignored: ${resourceType}.${action}`)
      }
    } catch (err) {
      console.error(`[gocardless-webhook] Error processing ${resourceType}.${action}:`, err)
      await sendInternalAlert({
        title: 'Error procesando evento de GoCardless',
        stage: 'gocardless.webhook.process_event',
        severity: 'critical',
        event: {
          id: event.id,
          resourceType,
          action,
        },
        details: {
          links: event.links,
          details: event.details,
        },
        error: err,
      })
    }
  }
}

// ── Payment events ──────────────────────────────────────────────────────────

async function handlePaymentEvent(action: string, event: Event): Promise<void> {
  const paymentId = event.links?.payment
  const mandateId = event.links?.mandate
  const cause = event.details?.cause ?? 'unknown'

  if (!mandateId) {
    console.warn('[gocardless-webhook] Payment event without mandateId')
    await sendInternalAlert({
      title: 'Evento de pago GoCardless sin mandateId',
      stage: 'gocardless.webhook.payment_without_mandate',
      severity: 'warning',
      event: { id: event.id, action },
      details: { links: event.links },
    })
    return
  }

  const tenant = await prisma.tenant.findFirst({
    where: { goCardlessMandateId: mandateId },
    select: {
      id: true,
      nif: true,
      legalName: true,
      name: true,
      subscriptionStatus: true,
      verifactuProvider: true,
    },
  })
  if (!tenant) {
    console.warn(`[gocardless-webhook] Tenant not found for mandate ${mandateId}`)
    await sendInternalAlert({
      title: 'No se encontró tenant para un pago de GoCardless',
      stage: 'gocardless.webhook.payment_tenant_not_found',
      severity: 'critical',
      event: { id: event.id, action, mandateId },
    })
    return
  }

  if (action === 'confirmed' || action === 'paid_out') {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
    if (tenant.verifactuProvider !== 'verifacti') {
      await activateVerifactuForTenant({
        id: tenant.id,
        nif: tenant.nif,
        legalName: tenant.legalName,
        name: tenant.name,
      })
    }
    console.log(`[gocardless-webhook] Payment confirmed: ${paymentId}`)
  } else if (action === 'failed') {
    const currentStatus = tenant.subscriptionStatus ?? 'PENDING'
    const newStatus = currentStatus === 'PENDING' ? 'EXPIRED' : 'PENDING'

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: newStatus,
      },
    })
    console.log(
      `[gocardless-webhook] Payment failed: ${paymentId}, cause: ${cause}, status: ${newStatus}`,
    )
    await sendInternalAlert({
      title: 'Cobro SEPA fallido',
      stage: 'gocardless.webhook.payment_failed',
      severity: 'warning',
      tenant: { id: tenant.id, name: tenant.legalName ?? tenant.name, nif: tenant.nif },
      event: { id: event.id, action, paymentId: paymentId ?? null, mandateId, cause, newStatus },
      details: { eventDetails: event.details },
    })
  }
}

// ── Subscription events ─────────────────────────────────────────────────────

async function handleSubscriptionEvent(action: string, event: Event): Promise<void> {
  const subscriptionId = event.links?.subscription
  if (!subscriptionId) return

  const tenant = await prisma.tenant.findFirst({
    where: { goCardlessSubscriptionId: subscriptionId },
    select: { id: true, nif: true, legalName: true, name: true, verifactuProvider: true },
  })
  if (!tenant) {
    console.warn(`[gocardless-webhook] Tenant not found for subscription ${subscriptionId}`)
    await sendInternalAlert({
      title: 'No se encontró tenant para una suscripción de GoCardless',
      stage: 'gocardless.webhook.subscription_tenant_not_found',
      severity: 'critical',
      event: { id: event.id, action, subscriptionId },
    })
    return
  }

  if (action === 'cancelled') {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: 'CANCELLED',
        subscriptionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
    console.log(`[gocardless-webhook] Subscription cancelled: ${subscriptionId}`)
  } else if (action === 'payment_created') {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { subscriptionStatus: 'ACTIVE' },
    })
    if (tenant.verifactuProvider !== 'verifacti') {
      await activateVerifactuForTenant({
        id: tenant.id,
        nif: tenant.nif,
        legalName: tenant.legalName,
        name: tenant.name,
      })
    }
    console.log(`[gocardless-webhook] Subscription payment created: ${subscriptionId}`)
  }
}

// ── Mandate events ──────────────────────────────────────────────────────────

async function handleMandateEvent(action: string, event: Event): Promise<void> {
  const mandateId = event.links?.mandate
  if (!mandateId) return

  const tenant = await prisma.tenant.findFirst({
    where: { goCardlessMandateId: mandateId },
    select: { id: true },
  })
  if (!tenant) {
    console.warn(`[gocardless-webhook] Tenant not found for mandate ${mandateId}`)
    await sendInternalAlert({
      title: 'No se encontró tenant para un mandato de GoCardless',
      stage: 'gocardless.webhook.mandate_tenant_not_found',
      severity: 'critical',
      event: { id: event.id, action, mandateId },
    })
    return
  }

  if (action === 'cancelled' || action === 'expired') {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: 'CANCELLED',
        goCardlessMandateId: null,
        goCardlessSubscriptionId: null,
        subscriptionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
    console.log(`[gocardless-webhook] Mandate cancelled: ${mandateId}`)
  }
}
