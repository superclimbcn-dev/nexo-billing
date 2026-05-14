import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@nexo/prisma'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
  return new Stripe(key, { apiVersion: '2026-04-22.dahlia' })
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
  const payload = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Stripe webhook signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const invoiceId = session.metadata?.invoiceId
    const tenantId = session.metadata?.tenantId

    if (!invoiceId || !tenantId) {
      console.error('Stripe webhook: missing metadata', session.metadata)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Update invoice status
        await tx.invoice.updateMany({
          where: { id: invoiceId, tenantId },
          data: {
            status: 'paid',
            paidAmount: Number(session.amount_total) / 100,
          },
        })

        // Create payment record
        await tx.payment.create({
          data: {
            tenantId,
            invoiceId,
            amount: Number(session.amount_total) / 100,
            currency: (session.currency ?? 'eur').toUpperCase(),
            method: 'card',
            direction: 'inbound',
            paidAt: new Date(),
            stripePaymentIntentId: session.payment_intent?.toString() ?? null,
            stripeCheckoutSessionId: session.id,
            reference: `Stripe ${session.payment_intent}`,
            notes: 'Pago via Stripe Checkout',
          },
        })
      })

      console.log(`Stripe webhook: invoice ${invoiceId} marked as paid`)
    } catch (err) {
      console.error('Stripe webhook: database error', err)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
