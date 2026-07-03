import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { QuotePdfDocument } from '@/lib/pdf/quote-pdf-document'
import { calculateInvoiceTotals } from '@/app/(app)/facturas/_lib/invoice-totals'
import type { PdfQuoteData } from '@/lib/pdf/quote-pdf-types'
import { signQuoteToken } from '@/lib/public-quote-token'
import QRCode from 'qrcode'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

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

  if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

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

  let buffer: Buffer
  try {
    buffer = await renderToBuffer(
      createElement(QuotePdfDocument, { data }) as ReactElement<DocumentProps>,
    )
  } catch (error) {
    console.error('Quote PDF generation error:', error)
    return NextResponse.json(
      { error: 'No hemos podido generar el PDF. Inténtalo de nuevo en unos minutos.' },
      { status: 500 },
    )
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${quote.number}.pdf"`,
      'Cache-Control': 'private, no-cache',
    },
  })
}
