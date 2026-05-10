'use server'

import Stripe from 'stripe'
import { prisma } from '@nexo/prisma'
import { signInvoiceToken } from '@/lib/public-invoice-token'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-04-22.dahlia',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

type ActionResult = { ok: true; url: string } | { ok: false; error: string }

export async function createCheckoutSession(
  invoiceId: string,
  tenantId: string,
): Promise<ActionResult> {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { client: { select: { name: true, email: true } } },
    })

    if (!invoice) {
      return { ok: false, error: 'Factura no encontrada' }
    }

    if (invoice.status === 'paid') {
      return { ok: false, error: 'Esta factura ya está pagada' }
    }

    if (invoice.status === 'cancelled') {
      return { ok: false, error: 'No se puede pagar una factura anulada' }
    }

    const token = signInvoiceToken({ invoiceId, tenantId })
    const successUrl = `${APP_URL}/f/${token}?success=1`
    const cancelUrl = `${APP_URL}/f/${token}?canceled=1`

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Factura ${invoice.fullNumber}`,
              description: `Factura de ${invoice.client.name}`,
            },
            unit_amount: Math.round(Number(invoice.totalAmount) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        invoiceId,
        tenantId,
      },
      customer_email: invoice.client.email ?? undefined,
    })

    if (!session.url) {
      return { ok: false, error: 'Error al crear la sesión de pago' }
    }

    return { ok: true, url: session.url }
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return { ok: false, error: 'Error al procesar el pago. Inténtalo de nuevo.' }
  }
}
