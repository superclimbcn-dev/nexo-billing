import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { prisma } from '@nexo/prisma'
import { verifyReceiptToken } from '@/lib/public-receipt-token'
import { ReceiptPdfDocument } from '@/lib/pdf/receipt-pdf-document'
import { calculateInvoiceTotals } from '@/app/(app)/facturas/_lib/invoice-totals'
import type { PdfReceiptData } from '@/lib/pdf/receipt-pdf-types'
import QRCode from 'qrcode'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  let payload: { receiptId: string; tenantId: string }
  try {
    payload = verifyReceiptToken(token)
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  const [receipt, tenant] = await Promise.all([
    prisma.receipt.findFirst({
      where: { id: payload.receiptId, tenantId: payload.tenantId },
      include: {
        client: true,
        lines: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      include: { branding: true },
    }),
  ])

  if (!receipt) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const totals = calculateInvoiceTotals(
    receipt.lines.map((l) => ({
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      vatRate: Number(l.vatRate),
    })),
  )

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

  let buffer: Buffer
  try {
    buffer = await renderToBuffer(
      createElement(ReceiptPdfDocument, { data }) as ReactElement<DocumentProps>,
    )
  } catch (error) {
    console.error('Public receipt PDF generation error:', error)
    return NextResponse.json(
      { error: 'No hemos podido generar el PDF. Inténtalo de nuevo en unos minutos.' },
      { status: 500 },
    )
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${receipt.number}.pdf"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
