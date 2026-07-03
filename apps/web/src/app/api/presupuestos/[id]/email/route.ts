import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { QuotePdfDocument } from '@/lib/pdf/quote-pdf-document'
import { calculateInvoiceTotals } from '@/app/(app)/facturas/_lib/invoice-totals'
import { signQuoteToken } from '@/lib/public-quote-token'
import type { PdfQuoteData } from '@/lib/pdf/quote-pdf-types'
import { QuoteEmailTemplate } from '@/lib/email/quote-email-template'
import { decryptSecret } from '@/lib/crypto/tenant-secrets'
import QRCode from 'qrcode'

export const runtime = 'nodejs'

const DEFAULT_EMAIL_FROM = process.env.EMAIL_FROM ?? 'presupuestos@nexo-billing.app'

function getResend(apiKey?: string) {
  const key = apiKey || process.env.RESEND_API_KEY
  if (!key) {
    throw new Error('RESEND_API_KEY not configured')
  }
  return new Resend(key)
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id as string | undefined
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant' }, { status: 403 })
    }

    const [quote, tenant] = await Promise.all([
      prisma.quote.findFirst({
        where: { id, tenantId },
        include: {
          client: true,
          lines: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { branding: true },
      }),
    ])

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const clientEmail = quote.client.email
    if (!clientEmail) {
      return NextResponse.json(
        { error: 'El cliente no tiene email registrado' },
        { status: 400 },
      )
    }

    const totals = calculateInvoiceTotals(
      quote.lines.map((l) => ({
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        vatRate: Number(l.vatRate),
      })),
    )

    const token = signQuoteToken({ quoteId: quote.id, tenantId: quote.tenantId })
    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/p/${token}`
    const qrCodeUrl = await QRCode.toDataURL(publicUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      type: 'image/png',
    })

    const data: PdfQuoteData = {
      tenant: {
        name: tenant.name,
        legalName: tenant.legalName,
        nif: tenant.nif,
        fiscalAddress: tenant.fiscalAddress,
        fiscalCity: tenant.fiscalCity,
        fiscalPostal: tenant.fiscalPostal,
        fiscalProvince: tenant.fiscalProvince,
        country: tenant.country,
        email: tenant.email,
        phone: tenant.phone,
        websiteUrl: tenant.websiteUrl,
        logoUrl: tenant.branding?.logoUrl ?? null,
      },
      client: {
        name: quote.client.name,
        legalName: quote.client.legalName,
        nif: quote.client.nif,
        address: quote.client.address,
        city: quote.client.city,
        postalCode: quote.client.postalCode,
        province: quote.client.province,
        country: quote.client.country,
        email: quote.client.email,
      },
      quote: {
        number: quote.number,
        issuedAt: quote.issuedAt,
        validUntil: quote.validUntil,
        notes: quote.notes,
        termsConditions: quote.termsConditions,
        status: quote.status,
        subtotal: Number(quote.subtotal),
        vatAmount: Number(quote.vatAmount),
        totalAmount: Number(quote.totalAmount),
      },
      lines: quote.lines.map((l) => ({
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        vatRate: Number(l.vatRate),
        subtotal: Number(l.subtotal),
        vatAmount: Number(l.vatAmount),
        totalAmount: Number(l.totalAmount),
      })),
      vatBreakdown: totals.vatBreakdown,
      qrCodeUrl,
    }

    // Generate PDF buffer
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await renderToBuffer(
        createElement(QuotePdfDocument, { data }) as ReactElement<DocumentProps>,
      )
    } catch (pdfErr) {
      console.error('Quote PDF generation error:', pdfErr)
      return NextResponse.json(
        { error: 'Error al generar el PDF adjunto' },
        { status: 500 },
      )
    }

    // Resolve tenant email config
    const tenantEmailFrom = tenant.emailFrom || DEFAULT_EMAIL_FROM
    const tenantFromName = tenant.emailFromName || tenant.name || 'Nexo Billing'

    if (!tenantEmailFrom) {
      console.warn('[quote-email-route] No email from configured, using fallback')
    }
    const tenantApiKey = tenant.emailApiKey
      ? decryptSecret(tenant.emailApiKey)
      : undefined

    // Send email
    let sendResult
    try {
      sendResult = await getResend(tenantApiKey).emails.send({
        from: `${tenantFromName} <${tenantEmailFrom}>`,
        to: clientEmail,
        replyTo: tenant.emailReplyTo || undefined,
        subject: `Presupuesto ${quote.number} — ${tenant.name}`,
        react: QuoteEmailTemplate({
          tenantName: tenant.name,
          quoteNumber: quote.number,
          totalAmount: Number(quote.totalAmount),
          clientName: quote.client.legalName || quote.client.name,
          publicUrl,
          validUntil: quote.validUntil,
        }) as ReactElement,
        attachments: [
          {
            filename: `${quote.number}.pdf`,
            content: Buffer.from(pdfBuffer).toString('base64'),
          },
        ],
      })
    } catch (resendErr) {
      console.error('Resend send error:', resendErr)
      return NextResponse.json(
        { error: 'Error al enviar el email. Inténtalo de nuevo.' },
        { status: 500 },
      )
    }

    if (sendResult.error) {
      console.error('Resend API error:', sendResult.error)
      return NextResponse.json(
        { error: 'Error al enviar el email. Inténtalo de nuevo.' },
        { status: 500 },
      )
    }

    // Mark quote as sent if it was a draft
    if (quote.status === 'draft') {
      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: 'sent' },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unhandled quote email route error:', err)
    return NextResponse.json(
      { error: 'Error inesperado al enviar el email' },
      { status: 500 },
    )
  }
}
