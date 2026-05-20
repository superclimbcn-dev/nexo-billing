import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { prisma } from '@nexo/prisma'
import { verifyInvoiceToken } from '@/lib/public-invoice-token'
import { InvoicePdfDocument } from '@/lib/pdf/invoice-pdf-document'
import { calculateInvoiceTotals } from '@/app/(app)/facturas/_lib/invoice-totals'
import type { PdfInvoiceData } from '@/lib/pdf/invoice-pdf-types'
import QRCode from 'qrcode'
import { generateAEATQRUrlFromInvoice } from '@nexo/verifactu'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  let payload: { invoiceId: string; tenantId: string }
  try {
    payload = verifyInvoiceToken(token)
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  const [invoice, tenant, verifactuRecord] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id: payload.invoiceId, tenantId: payload.tenantId },
      include: {
        client: true,
        lines: { orderBy: { sortOrder: 'asc' } },
        rectifiedBy: { select: { fullNumber: true } },
      },
    }),
    prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      include: { branding: true },
    }),
    prisma.invoiceRecord.findFirst({
      where: { invoiceId: payload.invoiceId, tenantId: payload.tenantId },
      orderBy: { createdAt: 'desc' },
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
      type: invoice.type,
      rectificationReason: invoice.rectificationReason,
      rectifiedBy: invoice.rectifiedBy ? { fullNumber: invoice.rectifiedBy.fullNumber } : null,
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
    aeatQrUrl: verifactuRecord?.qrUrl ?? undefined,
    verifactu: verifactuRecord
      ? {
          status: verifactuRecord.status as 'pending' | 'accepted' | 'rejected' | 'error',
          csv: (verifactuRecord.aeatResponse as Record<string, string> | null)?.csv ?? undefined,
          hash: verifactuRecord.hash,
          previousHash: verifactuRecord.previousHash,
          sentAt: verifactuRecord.sentAt ?? undefined,
        }
      : undefined,
  }

  let buffer: Buffer
  try {
    buffer = await renderToBuffer(
      createElement(InvoicePdfDocument, { data }) as ReactElement<DocumentProps>,
    )
  } catch (error) {
    console.error('Public PDF generation error:', error)
    return NextResponse.json(
      { error: 'No hemos podido generar el PDF. Inténtalo de nuevo en unos minutos.' },
      { status: 500 },
    )
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.fullNumber}.pdf"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
