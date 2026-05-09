import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { createServerClient } from '@nexo/core-auth'
import { prisma } from '@nexo/prisma'
import { InvoicePdfDocument } from '@/lib/pdf/invoice-pdf-document'
import { calculateInvoiceTotals } from '@/app/(app)/facturas/_lib/invoice-totals'
import type { PdfInvoiceData } from '@/lib/pdf/invoice-pdf-types'
import { signInvoiceToken } from '@/lib/public-invoice-token'
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

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const totals = calculateInvoiceTotals(
    invoice.lines.map((l) => ({
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      vatRate: Number(l.vatRate),
    })),
  )

  const token = signInvoiceToken({ invoiceId: invoice.id, tenantId: invoice.tenantId })
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/f/${token}`
  const qrCodeUrl = await QRCode.toDataURL(publicUrl, { width: 180, margin: 1 })

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

  const buffer = await renderToBuffer(
    createElement(InvoicePdfDocument, { data }) as ReactElement<DocumentProps>,
  )

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.fullNumber}.pdf"`,
      'Cache-Control': 'private, no-cache',
    },
  })
}
