import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { z } from 'zod'
import { createServerClient } from '@nexo/core-auth'
import { prisma, Prisma, InvoiceStatus } from '@nexo/prisma'

export const runtime = 'nodejs'

const CSV_INVOICE_SCHEMA = z.object({
  numero: z.string().min(1),
  fecha: z.string().min(1), // DD/MM/YYYY
  cliente_nif: z.string().min(1),
  cliente_nombre: z.string().min(1),
  concepto: z.string().min(1),
  cantidad: z.string().min(1),
  precio: z.string().min(1),
  iva: z.string().min(1),
  estado: z.enum(['draft', 'sent', 'paid', 'overdue']).optional().default('draft'),
})

type CsvInvoiceRow = z.infer<typeof CSV_INVOICE_SCHEMA>

function parseDateES(dateStr: string): Date {
  const parts = dateStr.trim().split(/[\/\-\.]/)
  if (parts.length === 3) {
    const d = Number(parts[0])
    const m = Number(parts[1])
    let y = Number(parts[2])
    if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(y)) {
      return new Date(dateStr)
    }
    if (y < 100) y = 2000 + y
    return new Date(y, m - 1, d)
  }
  return new Date(dateStr)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const csvText = await file.text()

    const parseResult = Papa.parse<CsvInvoiceRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter: ',',
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: 'Error parsing CSV', details: parseResult.errors.slice(0, 5) },
        { status: 400 },
      )
    }

    const rows = parseResult.data
    const results = { created: 0, errors: [] as string[] }

    // Get default series for invoices
    const series = await prisma.invoiceSeries.findFirst({
      where: { tenantId, code: 'A', isActive: true },
    })
    if (!series) {
      return NextResponse.json(
        { error: 'No active invoice series found. Create one first.' },
        { status: 400 },
      )
    }

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i]
      const parsed = CSV_INVOICE_SCHEMA.safeParse(raw)
      if (!parsed.success) {
        results.errors.push(`Row ${i + 2}: ${parsed.error.errors[0]?.message ?? 'Invalid data'}`)
        continue
      }

      const row = parsed.data

      try {
        // Find or create client
        let client = await prisma.client.findFirst({
          where: { tenantId, nif: row.cliente_nif, isActive: true },
        })

        if (!client) {
          client = await prisma.client.create({
            data: {
              tenantId,
              name: row.cliente_nombre,
              nif: row.cliente_nif,
              clientType: 'business',
              vatRegime: 'general',
              isActive: true,
            },
          })
        }

        const issuedAt = parseDateES(row.fecha)
        const quantity = Number(row.cantidad.replace(',', '.'))
        const unitPrice = Number(row.precio.replace(',', '.'))
        const vatRate = Number(row.iva.replace('%', ''))

        const lineSubtotal = quantity * unitPrice
        const lineVat = lineSubtotal * (vatRate / 100)
        const lineTotal = lineSubtotal + lineVat

        // Create invoice
        await prisma.invoice.create({
          data: {
            tenantId,
            clientId: client.id,
            seriesId: series.id,
            number: series.nextNumber + i,
            fullNumber: row.numero || `A-${issuedAt.getFullYear()}-${String(series.nextNumber + i).padStart(4, '0')}`,
            type: 'F1',
            status: row.estado as InvoiceStatus,
            issuedAt,
            dueAt: new Date(issuedAt.getTime() + 30 * 86400000),
            subtotal: new Prisma.Decimal(lineSubtotal),
            vatAmount: new Prisma.Decimal(lineVat),
            totalAmount: new Prisma.Decimal(lineTotal),
            paidAmount: row.estado === 'paid' ? new Prisma.Decimal(lineTotal) : new Prisma.Decimal(0),
            pendingAmount: row.estado === 'paid' ? new Prisma.Decimal(0) : new Prisma.Decimal(lineTotal),
            currency: 'EUR',
            imported: true,
            importedFromSystem: 'CSV',
            importedAt: new Date(),
            lines: {
              create: [
                {
                  description: row.concepto,
                  quantity: new Prisma.Decimal(quantity),
                  unitPrice: new Prisma.Decimal(unitPrice),
                  discountPercent: new Prisma.Decimal(0),
                  vatRate: new Prisma.Decimal(vatRate),
                  claveOperacion: '01',
                  subtotal: new Prisma.Decimal(lineSubtotal),
                  vatAmount: new Prisma.Decimal(lineVat),
                  totalAmount: new Prisma.Decimal(lineTotal),
                  sortOrder: 0,
                },
              ],
            },
          },
        })

        results.created++
      } catch (err) {
        results.errors.push(
          `Row ${i + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.created,
      errors: results.errors,
    })
  } catch (err) {
    console.error('CSV import error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 },
    )
  }
}
