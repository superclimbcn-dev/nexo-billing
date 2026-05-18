'use server'

import { prisma } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createQuoteSchema } from './quote-schema'
import { calculateInvoiceTotals } from '../../facturas/_lib/invoice-totals'
import { checkCanCreateInvoice } from '@/lib/subscription-gate'

type QuoteStatusValue = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

type SimpleResult = { ok: true } | { ok: false; error: string }

async function requireAuth() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')
  return { tenantId }
}

async function getAuthContext() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) return null
  return { tenantId }
}

function roundCents(v: number): number {
  return Math.round(v * 100) / 100
}

const ALLOWED_TRANSITIONS: Partial<Record<QuoteStatusValue, QuoteStatusValue[]>> = {
  draft: ['sent', 'accepted', 'rejected'],
  sent: ['accepted', 'rejected', 'expired'],
}

export async function createQuoteDraft(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const { tenantId } = await requireAuth()

  const canCreate = await checkCanCreateInvoice(tenantId)
  if (!canCreate) {
    return {
      ok: false,
      error: 'Tu periodo de prueba ha finalizado. Activa tu suscripción para continuar.',
    }
  }

  const parsed = createQuoteSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { clientId, issuedAt, validUntil, notes, lines } = parsed.data

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId, isActive: true },
  })
  if (!client) return { ok: false, error: 'Cliente no válido' }

  const totals = calculateInvoiceTotals(
    lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice, vatRate: l.vatRate })),
  )

  const linesWithAmounts = lines.map((line) => {
    const sub = roundCents(line.quantity * line.unitPrice)
    const vat = roundCents(sub * (line.vatRate / 100))
    return { ...line, lineSubtotal: sub, lineVatAmount: vat, lineTotal: roundCents(sub + vat) }
  })

  const result = await prisma.$transaction(async (tx) => {
    // Get or create P series inside transaction for atomicity
    const existingSeries = await tx.invoiceSeries.findFirst({
      where: { tenantId, code: 'P' },
    })

    let num: number

    if (!existingSeries) {
      await tx.invoiceSeries.create({
        data: {
          tenantId,
          code: 'P',
          name: 'Presupuestos',
          nextNumber: 2,
          isDefault: false,
          isActive: true,
        },
      })
      num = 1
    } else {
      await tx.invoiceSeries.update({
        where: { id: existingSeries.id },
        data: { nextNumber: { increment: 1 } },
      })
      num = existingSeries.nextNumber
    }

    const year = new Date(issuedAt).getFullYear()
    const number = `P-${year}-${String(num).padStart(4, '0')}`

    const quote = await tx.quote.create({
      data: {
        tenantId,
        clientId,
        number,
        status: 'draft',
        issuedAt,
        validUntil,
        subtotal: totals.subtotal,
        vatAmount: totals.vatTotal,
        totalAmount: totals.total,
        notes: notes ?? null,
      },
      select: { id: true },
    })

    await tx.quoteLine.createMany({
      data: linesWithAmounts.map((line, idx) => ({
        quoteId: quote.id,
        itemId: line.itemId ?? null,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        vatRate: line.vatRate,
        subtotal: line.lineSubtotal,
        vatAmount: line.lineVatAmount,
        totalAmount: line.lineTotal,
        sortOrder: idx,
      })),
    })

    return quote
  })

  revalidatePath('/presupuestos')
  return { ok: true, data: { id: result.id } }
}

export async function updateQuoteStatus(
  quoteId: string,
  newStatus: QuoteStatusValue,
): Promise<SimpleResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, tenantId: ctx.tenantId },
    select: { id: true, status: true },
  })
  if (!quote) return { ok: false, error: 'Presupuesto no encontrado' }

  const allowed = ALLOWED_TRANSITIONS[quote.status as QuoteStatusValue] ?? []
  if (!allowed.includes(newStatus)) {
    return { ok: false, error: `No se puede cambiar a estado "${newStatus}"` }
  }

  const now = new Date()
  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: newStatus,
      ...(newStatus === 'accepted' ? { acceptedAt: now } : {}),
      ...(newStatus === 'rejected' ? { rejectedAt: now } : {}),
    },
  })

  revalidatePath('/presupuestos')
  revalidatePath(`/presupuestos/${quoteId}`)
  return { ok: true }
}

export async function deleteQuoteDraft(quoteId: string): Promise<SimpleResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, tenantId: ctx.tenantId },
    select: { id: true, status: true },
  })
  if (!quote) return { ok: false, error: 'Presupuesto no encontrado' }
  if (quote.status !== 'draft') return { ok: false, error: 'Solo borradores pueden eliminarse' }

  await prisma.$transaction(async (tx) => {
    await tx.quoteLine.deleteMany({ where: { quoteId } })
    await tx.quote.delete({ where: { id: quoteId } })
  })

  revalidatePath('/presupuestos')
  redirect('/presupuestos')
}

export async function convertQuoteToInvoice(
  quoteId: string,
): Promise<ActionResult<{ invoiceId: string }>> {
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const [quote, defaultSeries] = await Promise.all([
    prisma.quote.findFirst({
      where: { id: quoteId, tenantId: ctx.tenantId },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.invoiceSeries.findFirst({
      where: { tenantId: ctx.tenantId, isDefault: true, isActive: true },
    }),
  ])

  if (!quote) return { ok: false, error: 'Presupuesto no encontrado' }
  if (quote.status !== 'accepted') {
    return { ok: false, error: 'Solo presupuestos aceptados pueden convertirse en factura' }
  }
  if (!defaultSeries) {
    return { ok: false, error: 'No hay serie de facturación por defecto configurada' }
  }

  const result = await prisma.$transaction(async (tx) => {
    const lockedSeries = await tx.invoiceSeries.update({
      where: { id: defaultSeries.id },
      data: { nextNumber: { increment: 1 } },
    })
    const num = lockedSeries.nextNumber - 1
    const year = new Date().getFullYear()
    const fullNumber = `${defaultSeries.code}-${year}-${String(num).padStart(4, '0')}`

    const invoice = await tx.invoice.create({
      data: {
        tenantId: ctx.tenantId,
        clientId: quote.clientId,
        seriesId: defaultSeries.id,
        number: num,
        fullNumber,
        issuedAt: new Date(),
        status: 'draft',
        subtotal: quote.subtotal,
        vatAmount: quote.vatAmount,
        totalAmount: quote.totalAmount,
        fromQuoteId: quote.id,
        notes: quote.notes,
      },
      select: { id: true },
    })

    await tx.invoiceLine.createMany({
      data: quote.lines.map((line, idx) => ({
        invoiceId: invoice.id,
        itemId: line.itemId ?? null,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        vatRate: line.vatRate,
        subtotal: line.subtotal,
        vatAmount: line.vatAmount,
        totalAmount: line.totalAmount,
        sortOrder: idx,
      })),
    })

    await tx.quote.update({
      where: { id: quoteId },
      data: { status: 'converted', convertedAt: new Date() },
    })

    return invoice
  })

  revalidatePath('/presupuestos')
  revalidatePath(`/presupuestos/${quoteId}`)
  revalidatePath('/facturas')
  return { ok: true, data: { invoiceId: result.id } }
}
