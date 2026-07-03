import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { ReceiptPdfDocument } from '@/lib/pdf/receipt-pdf-document'
import { calculateInvoiceTotals } from '@/app/(app)/facturas/_lib/invoice-totals'
import { signReceiptToken } from '@/lib/public-receipt-token'
import type { PdfReceiptData } from '@/lib/pdf/receipt-pdf-types'
import { ReceiptEmailTemplate } from '@/lib/email/receipt-email-template'
import { decryptSecret } from '@/lib/crypto/tenant-secrets'
import QRCode from 'qrcode'

export const runtime = 'nodejs'

const DEFAULT_EMAIL_FROM = process.env.EMAIL_FROM ?? 'recibos@nexo-billing.app'

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

    const [receipt, tenant] = await Promise.all([
      prisma.receipt.findFirst({
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

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const clientEmail = receipt.client.email
    if (!clientEmail) {
      return NextResponse.json(
        { error: 'El cliente no tiene email registrado' },
        { status: 400 },
      )
    }

    const totals = calculateInvoiceTotals(
      receipt.lines.map((l) => ({
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        vatRate: Number(l.vatRate),
      })),
    )

    const token = signReceiptToken({ receiptId: receipt.id, tenantId: receipt.tenantId })
    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/r/${token}`
    const qrCodeUrl = await QRCode.toDataURL(publicUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      type: 'image/png',
    })

    const data: PdfReceiptData = {
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
        name: receipt.client.name,
        legalName: receipt.client.legalName,
        nif: receipt.client.nif,
        address: receipt.client.address,
        city: receipt.client.city,
        postalCode: receipt.client.postalCode,
        province: receipt.client.province,
        country: receipt.client.country,
        email: receipt.client.email,
      },
      receipt: {
        number: receipt.number,
        issuedAt: receipt.issuedAt,
        notes: receipt.notes,
        termsConditions: receipt.termsConditions,
        status: receipt.status,
        subtotal: Number(receipt.subtotal),
        vatAmount: Number(receipt.vatAmount),
        totalAmount: Number(receipt.totalAmount),
      },
      lines: receipt.lines.map((l) => ({
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

    let pdfBuffer: Buffer
    try {
      pdfBuffer = await renderToBuffer(
        createElement(ReceiptPdfDocument, { data }) as ReactElement<DocumentProps>,
      )
    } catch (pdfErr) {
      console.error('Receipt PDF generation error:', pdfErr)
      return NextResponse.json(
        { error: 'Error al generar el PDF adjunto' },
        { status: 500 },
      )
    }

    const tenantEmailFrom = tenant.emailFrom || DEFAULT_EMAIL_FROM
    const tenantFromName = tenant.emailFromName || tenant.name || 'Nexo Billing'

    if (!tenantEmailFrom) {
      console.warn('[receipt-email-route] No email from configured, using fallback')
    }
    const tenantApiKey = tenant.emailApiKey
      ? decryptSecret(tenant.emailApiKey)
      : undefined

    let sendResult
    try {
      sendResult = await getResend(tenantApiKey).emails.send({
        from: `${tenantFromName} <${tenantEmailFrom}>`,
        to: clientEmail,
        replyTo: tenant.emailReplyTo || undefined,
        subject: `Recibo ${receipt.number} — ${tenant.name}`,
        react: ReceiptEmailTemplate({
          tenantName: tenant.name,
          receiptNumber: receipt.number,
          totalAmount: Number(receipt.totalAmount),
          clientName: receipt.client.legalName || receipt.client.name,
          publicUrl,
        }) as ReactElement,
        attachments: [
          {
            filename: `${receipt.number}.pdf`,
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

    if (receipt.status === 'draft') {
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: { status: 'issued', issuedAtDate: new Date() },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unhandled receipt email route error:', err)
    return NextResponse.json(
      { error: 'Error inesperado al enviar el email' },
      { status: 500 },
    )
  }
}
