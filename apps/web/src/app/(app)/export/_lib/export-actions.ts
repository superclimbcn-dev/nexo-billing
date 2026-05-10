'use server'

import { prisma, UserRole } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'
import JSZip from 'jszip'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { InvoicePdfDocument } from '@/lib/pdf/invoice-pdf-document'
import { calculateInvoiceTotals } from '../../facturas/_lib/invoice-totals'
import type { PdfInvoiceData } from '@/lib/pdf/invoice-pdf-types'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import { signInvoiceToken } from '@/lib/public-invoice-token'

export interface ExportFilters {
  dateFrom?: string
  dateTo?: string
  types?: ('invoices' | 'expenses' | 'all')[]
}

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

async function requireOwnerOrAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const tenantId = user.app_metadata?.tenant_id as string | undefined
  const role = user.app_metadata?.role as string | undefined

  if (!tenantId) return null
  if (role !== UserRole.OWNER && role !== UserRole.ADMIN) {
    return null
  }

  return { user, tenantId }
}

function formatCSV(rows: string[][]): string {
  return rows.map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
  ).join('\n')
}

async function generateInvoicePdf(invoice: {
  id: string
  fullNumber: string
  issuedAt: Date
  dueAt: Date | null
  notes: string | null
  status: string
  subtotal: number
  vatAmount: number
  totalAmount: number
  client: {
    name: string
    legalName: string | null
    nif: string
    address: string | null
    city: string | null
    postalCode: string | null
    province: string | null
    country: string
    email: string | null
  }
  lines: Array<{
    description: string
    quantity: number
    unitPrice: number
    vatRate: number
    subtotal: number
    vatAmount: number
    totalAmount: number
  }>
}, tenant: {
  name: string
  legalName: string | null
  nif: string
  fiscalAddress: string | null
  fiscalCity: string | null
  fiscalPostal: string | null
  fiscalProvince: string | null
  country: string
  iban: string | null
  email: string | null
  phone: string | null
  websiteUrl: string | null
  branding: { logoUrl: string | null } | null
}): Promise<Uint8Array> {
  const totals = calculateInvoiceTotals(invoice.lines)

  const token = signInvoiceToken({ invoiceId: invoice.id, tenantId: '' })
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
      subtotal: invoice.subtotal,
      vatAmount: invoice.vatAmount,
      totalAmount: invoice.totalAmount,
    },
    lines: invoice.lines,
    vatBreakdown: totals.vatBreakdown,
    qrCodeUrl,
  }

  const buffer = await renderToBuffer(
    createElement(InvoicePdfDocument, { data }) as ReactElement<DocumentProps>,
  )

  return new Uint8Array(buffer)
}

export async function exportData(
  filters: ExportFilters,
): Promise<ActionResult<{ buffer: Uint8Array; filename: string }>> {
  const ctx = await requireOwnerOrAdmin()
  if (!ctx) {
    return { ok: false, error: 'No tienes permiso para exportar' }
  }

  const types = filters.types ?? ['all']
  const includeInvoices = types.includes('invoices') || types.includes('all')
  const includeExpenses = types.includes('expenses') || types.includes('all')

  const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : undefined
  const dateTo = filters.dateTo ? new Date(filters.dateTo) : undefined

  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    include: { branding: true },
  })
  if (!tenant) {
    return { ok: false, error: 'Tenant no encontrado' }
  }

  const zip = new JSZip()
  const invoicesFolder = zip.folder('facturas')
  const expensesFolder = zip.folder('gastos')
  const dataFolder = zip.folder('datos')

  let invoices: Array<{
    fullNumber: string
    issuedAt: Date
    clientName: string
    clientNif: string
    subtotal: number
    vatAmount: number
    totalAmount: number
    lines: Array<{
      description: string
      quantity: number
      unitPrice: number
      vatRate: number
      subtotal: number
      vatAmount: number
      totalAmount: number
    }>
  }> = []

  let expenses: Array<{
    issuedAt: Date
    category: string | null
    notes: string | null
    vendor: string | null
    totalAmount: number
    attachmentUrl: string | null
  }> = []

  // ── Invoices ───────────────────────────────────────────────────────────────
  if (includeInvoices) {
    const rawInvoices = await prisma.invoice.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(dateFrom || dateTo
          ? {
              issuedAt: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {}),
      },
      include: {
        client: true,
        lines: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { issuedAt: 'desc' },
      take: 100,
    })

    for (const inv of rawInvoices) {
      const invoiceData = {
        id: inv.id,
        fullNumber: inv.fullNumber,
        issuedAt: inv.issuedAt,
        dueAt: inv.dueAt,
        notes: inv.notes,
        status: inv.status,
        subtotal: Number(inv.subtotal),
        vatAmount: Number(inv.vatAmount),
        totalAmount: Number(inv.totalAmount),
        client: {
          name: inv.client.name,
          legalName: inv.client.legalName,
          nif: inv.client.nif,
          address: inv.client.address,
          city: inv.client.city,
          postalCode: inv.client.postalCode,
          province: inv.client.province,
          country: inv.client.country,
          email: inv.client.email,
        },
        lines: inv.lines.map((l) => ({
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          vatRate: Number(l.vatRate),
          subtotal: Number(l.subtotal),
          vatAmount: Number(l.vatAmount),
          totalAmount: Number(l.totalAmount),
        })),
      }

      try {
        const pdfBytes = await generateInvoicePdf(invoiceData, {
          ...tenant,
          branding: tenant.branding ? { logoUrl: tenant.branding.logoUrl } : null,
        })
        invoicesFolder?.file(`${inv.fullNumber}.pdf`, pdfBytes)
      } catch (err) {
        console.error(`[exportData] Failed to generate PDF for invoice ${inv.id}:`, err)
      }

      invoices.push({
        fullNumber: inv.fullNumber,
        issuedAt: inv.issuedAt,
        clientName: inv.client.name,
        clientNif: inv.client.nif,
        subtotal: Number(inv.subtotal),
        vatAmount: Number(inv.vatAmount),
        totalAmount: Number(inv.totalAmount),
        lines: invoiceData.lines,
      })
    }
  }

  // ── Expenses ───────────────────────────────────────────────────────────────
  if (includeExpenses) {
    const rawExpenses = await prisma.expense.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(dateFrom || dateTo
          ? {
              issuedAt: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {}),
      },
      orderBy: { issuedAt: 'desc' },
      take: 100,
    })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    )

    for (const exp of rawExpenses) {
      if (exp.attachmentUrl) {
        try {
          const path = exp.attachmentUrl.split('/receipts/')[1]
          if (path) {
            const { data: fileData, error: downloadError } = await admin.storage
              .from('receipts')
              .download(path)
            if (!downloadError && fileData) {
              const bytes = await fileData.arrayBuffer()
              expensesFolder?.file(`recibo_${exp.id}.pdf`, new Uint8Array(bytes))
            }
          }
        } catch (err) {
          console.error(`[exportData] Failed to download receipt for expense ${exp.id}:`, err)
        }
      }

      expenses.push({
        issuedAt: exp.issuedAt,
        category: exp.category,
        notes: exp.notes,
        vendor: exp.vendor,
        totalAmount: Number(exp.totalAmount),
        attachmentUrl: exp.attachmentUrl,
      })
    }
  }

  // ── CSV Facturas ───────────────────────────────────────────────────────────
  const invoiceCSVRows = [
    ['numero', 'fecha', 'cliente', 'nif', 'base_imponible', 'tipo_iva', 'cuota_iva', 'total'],
    ...invoices.map((inv) => {
      const vatRate = inv.lines.length > 0 ? inv.lines[0]?.vatRate ?? 0 : 0
      return [
        inv.fullNumber,
        inv.issuedAt.toISOString().slice(0, 10),
        inv.clientName,
        inv.clientNif,
        inv.subtotal.toFixed(2),
        `${vatRate}%`,
        inv.vatAmount.toFixed(2),
        inv.totalAmount.toFixed(2),
      ]
    }),
  ]
  dataFolder?.file('facturas.csv', formatCSV(invoiceCSVRows))

  // ── CSV Gastos ─────────────────────────────────────────────────────────────
  const expenseCSVRows = [
    ['fecha', 'categoria', 'descripcion', 'proveedor', 'importe'],
    ...expenses.map((exp) => [
      exp.issuedAt.toISOString().slice(0, 10),
      exp.category ?? '',
      exp.notes ?? '',
      exp.vendor ?? '',
      exp.totalAmount.toFixed(2),
    ]),
  ]
  dataFolder?.file('gastos.csv', formatCSV(expenseCSVRows))

  // ── JSON Resumen ───────────────────────────────────────────────────────────
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0)
  const totalVatRepercutido = invoices.reduce((sum, inv) => sum + inv.vatAmount, 0)

  const summary = {
    tenant: {
      name: tenant.name,
      nif: tenant.nif,
    },
    periodo: {
      desde: dateFrom?.toISOString().slice(0, 10) ?? null,
      hasta: dateTo?.toISOString().slice(0, 10) ?? null,
    },
    totales: {
      facturado: totalInvoiced,
      gastos: totalExpenses,
      iva_repercutido: totalVatRepercutido,
      iva_soportado: 0,
    },
    contagem: {
      facturas: invoices.length,
      gastos: expenses.length,
    },
  }
  dataFolder?.file('resumen.json', JSON.stringify(summary, null, 2))

  // ── Generate ZIP ───────────────────────────────────────────────────────────
  const zipBuffer = await zip.generateAsync({ type: 'uint8array' })

  const filename = `nexo_export_${tenant.nif}_${dateFrom?.toISOString().slice(0, 10) ?? 'inicio'}_${dateTo?.toISOString().slice(0, 10) ?? 'hoy'}.zip`

  return { ok: true, data: { buffer: zipBuffer, filename } }
}
