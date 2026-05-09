import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { InvoicePdfDocument } from '@/lib/pdf/invoice-pdf-document'
import { calculateInvoiceTotals } from '@/app/(app)/facturas/_lib/invoice-totals'
import { signInvoiceToken } from '@/lib/public-invoice-token'
import type { PdfInvoiceData } from '@/lib/pdf/invoice-pdf-types'
import { InvoiceEmailTemplate } from '@/lib/email/invoice-email-template'
import QRCode from 'qrcode'

export const runtime = 'nodejs'

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'facturas@nexo-billing.app'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured')
  }
  return new Resend(apiKey)
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

    const [invoice, tenant] = await Promise.all([
      prisma.invoice.findFirst({
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

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const clientEmail = invoice.client.email
    if (!clientEmail) {
      return NextResponse.json(
        { error: 'El cliente no tiene email registrado' },
        { status: 400 },
      )
    }

    const totals = calculateInvoiceTotals(
      invoice.lines.map((l) => ({
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        vatRate: Number(l.vatRate),
      })),
    )

    const token = signInvoiceToken({ invoiceId: invoice.id, tenantId: invoice.tenantId })
    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/f/${token}`
    const qrCodeUrl = await QRCode.toDataURL(publicUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      type: 'image/png',
    })

    const data: PdfInvoiceData = {
      tenant: {
        name: tenant.name,
        legalName: tenant.legalName,
        nif: tenant.nif,
        fiscalAddress: tenant.fiscalAddress,
        fiscalCity: tenant.fiscalCity,
        fiscalPostal: tenant.fiscalPostal,
        fiscalProvince: tenant.fiscalProvince,
        country: tenant.country,
        iban: tenant.iban,
        email: tenant.email,
        phone: tenant.phone,
        websiteUrl: tenant.websiteUrl,
        logoUrl: tenant.branding?.logoUrl ?? null,
      },
      client: {
        name: invoice.client.name,
        legalName: invoice.client.legalName,
        nif: invoice.client.nif,
        address: invoice.client.address,
        city: invoice.client.city,
        postalCode: invoice.client.postalCode,
        province: invoice.client.province,
        country: invoice.client.country,
        email: invoice.client.email,
      },
      invoice: {
        fullNumber: invoice.fullNumber,
        issuedAt: invoice.issuedAt,
        dueAt: invoice.dueAt,
        notes: invoice.notes,
        status: invoice.status,
        subtotal: Number(invoice.subtotal),
        vatAmount: Number(invoice.vatAmount),
        totalAmount: Number(invoice.totalAmount),
      },
      lines: invoice.lines.map((l) => ({
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
        createElement(InvoicePdfDocument, { data }) as ReactElement<DocumentProps>,
      )
    } catch (pdfErr) {
      console.error('PDF generation error:', pdfErr)
      return NextResponse.json(
        { error: 'Error al generar el PDF adjunto' },
        { status: 500 },
      )
    }

    // publicUrl already generated above with qrCodeUrl

    // Send email
    let sendResult
    try {
      sendResult = await getResend().emails.send({
        from: `${tenant.name} <${EMAIL_FROM}>`,
        to: clientEmail,
        subject: `Factura ${invoice.fullNumber} — ${tenant.name}`,
        react: InvoiceEmailTemplate({
          tenantName: tenant.name,
          invoiceNumber: invoice.fullNumber,
          totalAmount: Number(invoice.totalAmount),
          clientName: invoice.client.legalName || invoice.client.name,
          publicUrl,
          dueDate: invoice.dueAt,
        }) as ReactElement,
        attachments: [
          {
            filename: `${invoice.fullNumber}.pdf`,
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

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unhandled email route error:', err)
    return NextResponse.json(
      { error: 'Error inesperado al enviar el email' },
      { status: 500 },
    )
  }
}
