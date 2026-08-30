'use server'

import { prisma, Prisma } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createInvoiceSchema, createSimplifiedInvoiceSchema } from './invoice-schema'
import { calculateInvoiceTotals } from './invoice-totals'
import { calculateSimplifiedInvoiceAmounts } from './simplified-invoice-calculation'
import { reserveInvoiceNumber } from './invoice-numbering'
import { requireOwnerOrAdminAction } from '@/lib/auth/role-guard'
import { checkCanCreateInvoice } from '@/lib/subscription-gate'

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

async function requireAuth() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')
  return { user, tenantId }
}

function roundCents(v: number): number {
  return Math.round(v * 100) / 100
}

export async function createInvoiceDraft(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return { ok: false, error: 'No tienes permiso para realizar esta acción' }
  const { tenantId } = auth

  const canCreate = await checkCanCreateInvoice(tenantId)
  if (!canCreate) {
    return {
      ok: false,
      error: 'Tu periodo de prueba ha finalizado. Activa tu suscripción para continuar.',
    }
  }

  const parsed = createInvoiceSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { clientId, seriesId, issuedAt, dueAt, notes, lines } = parsed.data

  const [client, series] = await Promise.all([
    prisma.client.findFirst({ where: { id: clientId, tenantId, isActive: true } }),
    prisma.invoiceSeries.findFirst({ where: { id: seriesId, tenantId, isActive: true } }),
  ])
  if (!client) return { ok: false, error: 'Cliente no válido' }
  if (!series) return { ok: false, error: 'Serie no válida' }

  const invoiceTotals = calculateInvoiceTotals(
    lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice, vatRate: l.vatRate })),
  )

  const linesWithAmounts = lines.map((line) => {
    const sub = roundCents(line.quantity * line.unitPrice)
    const vat = roundCents(sub * (line.vatRate / 100))
    return { ...line, lineSubtotal: sub, lineVatAmount: vat, lineTotalAmount: roundCents(sub + vat) }
  })

  const result = await prisma.$transaction(async (tx) => {
    const reservation = await reserveInvoiceNumber(
      () =>
        tx.invoiceSeries.update({
          where: { id: seriesId, tenantId, isActive: true },
          data: { nextNumber: { increment: 1 } },
          select: { code: true, numberFormat: true, nextNumber: true },
        }),
      issuedAt,
    )

    const invoice = await tx.invoice.create({
      data: {
        tenantId,
        clientId,
        seriesId,
        number: reservation.number,
        fullNumber: reservation.fullNumber,
        issuedAt,
        dueAt: dueAt ?? null,
        status: 'draft',
        subtotal: invoiceTotals.subtotal,
        vatAmount: invoiceTotals.vatTotal,
        totalAmount: invoiceTotals.total,
        notes: notes ?? null,
      },
      select: { id: true },
    })

    await tx.invoiceLine.createMany({
      data: linesWithAmounts.map((line, idx) => ({
        invoiceId: invoice.id,
        itemId: line.itemId ?? null,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        vatRate: line.vatRate,
        subtotal: line.lineSubtotal,
        vatAmount: line.lineVatAmount,
        totalAmount: line.lineTotalAmount,
        sortOrder: idx,
      })),
    })

    return invoice
  })

  revalidatePath('/facturas')
  return { ok: true, data: { id: result.id } }
}

export async function createSimplifiedInvoice(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return { ok: false, error: 'No tienes permiso para realizar esta acción' }
  const { tenantId } = auth

  const canCreate = await checkCanCreateInvoice(tenantId)
  if (!canCreate) {
    return {
      ok: false,
      error: 'Tu periodo de prueba ha finalizado. Activa tu suscripción para continuar.',
    }
  }

  const parsed = createSimplifiedInvoiceSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const {
    issuedAt,
    operationAt,
    description,
    totalVatIncluded,
    vatRate,
    paymentMethod,
    paymentReference,
    consumerHomeService,
  } = parsed.data

  const inactiveSeries = await prisma.invoiceSeries.findFirst({
    where: { tenantId, code: 'FS', isActive: false },
    select: { id: true },
  })
  if (inactiveSeries) {
    return {
      ok: false,
      error: 'La serie FS está desactivada. Actívala en Ajustes antes de emitir.',
    }
  }

  const amounts = calculateSimplifiedInvoiceAmounts(totalVatIncluded, vatRate)

  try {
    const result = await prisma.$transaction(async (tx) => {
      const series = await tx.invoiceSeries.upsert({
        where: { tenantId_code: { tenantId, code: 'FS' } },
        update: {},
        create: {
          tenantId,
          code: 'FS',
          name: 'Facturas simplificadas',
          prefix: 'FS-',
          numberFormat: '0000',
          nextNumber: 1,
          isDefault: false,
          isActive: true,
          resetYearly: false,
          yearOfNumbering: issuedAt.getFullYear(),
        },
        select: { id: true },
      })

      const reservation = await reserveInvoiceNumber(
        () =>
          tx.invoiceSeries.update({
            where: { id: series.id, tenantId, isActive: true },
            data: { nextNumber: { increment: 1 } },
            select: { code: true, numberFormat: true, nextNumber: true },
          }),
        issuedAt,
      )

      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          clientId: null,
          seriesId: series.id,
          number: reservation.number,
          fullNumber: reservation.fullNumber,
          type: 'F2',
          status: 'draft',
          issuedAt,
          operationAt,
          dueAt: null,
          subtotal: amounts.subtotal,
          vatAmount: amounts.vatAmount,
          totalAmount: amounts.totalAmount,
          paidAmount: amounts.totalAmount,
          pendingAmount: new Prisma.Decimal(0),
          paymentMethod,
          sectorMetadata: {
            simplifiedInvoice: { consumerHomeService },
          },
        },
        select: { id: true },
      })

      await tx.invoiceLine.create({
        data: {
          invoiceId: invoice.id,
          itemId: null,
          description,
          quantity: new Prisma.Decimal('1.000'),
          unitPrice: amounts.subtotal,
          vatRate: new Prisma.Decimal(vatRate),
          subtotal: amounts.subtotal,
          vatAmount: amounts.vatAmount,
          totalAmount: amounts.totalAmount,
          sortOrder: 0,
        },
      })

      await tx.payment.create({
        data: {
          tenantId,
          direction: 'inbound',
          amount: amounts.totalAmount,
          currency: 'EUR',
          method: paymentMethod,
          paidAt: operationAt,
          invoiceId: invoice.id,
          reference:
            paymentMethod === 'card' && paymentReference ? paymentReference : null,
          notes: 'Cobro registrado al emitir factura simplificada',
        },
      })

      return tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'paid' },
        select: { id: true },
      })
    })

    revalidatePath('/facturas')
    revalidatePath('/tesoreria')
    revalidatePath('/impuestos')
    return { ok: true, data: { id: result.id } }
  } catch (error) {
    console.error('Simplified invoice creation failed:', error)
    return {
      ok: false,
      error: 'No se pudo emitir la factura simplificada. Inténtalo de nuevo.',
    }
  }
}
