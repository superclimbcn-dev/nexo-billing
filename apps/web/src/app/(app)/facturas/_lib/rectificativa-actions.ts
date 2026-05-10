'use server'

import { prisma, InvoiceType, InvoiceStatus } from '@nexo/prisma'
import { revalidatePath } from 'next/cache'
import { calculateInvoiceTotals } from './invoice-totals'
import { requireOwnerOrAdminAction } from '@/lib/auth/role-guard'
import { createRectificativaSchema } from './rectificativa-schema'

// ── Types ───────────────────────────────────────────────────────────────────

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

// ── Helpers ─────────────────────────────────────────────────────────────────

function roundCents(v: number): number {
  return Math.round(v * 100) / 100
}

const RECTIFICATIVA_LABELS: Record<string, string> = {
  R1: 'Error fundado en derecho',
  R2: 'Devolución de mercancía',
  R3: 'Descuento posterior',
  R4: 'Obra por administración',
  R5: 'Resolución de contrato',
}

// ── Server Action ───────────────────────────────────────────────────────────

export async function createRectificativa(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return { ok: false, error: 'No tienes permiso para realizar esta acción' }
  const { tenantId } = auth

  const parsed = createRectificativaSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { originalInvoiceId, type, reason, lines } = parsed.data

  // 1. Fetch original invoice with rectification check
  const original = await prisma.invoice.findFirst({
    where: { id: originalInvoiceId, tenantId },
    include: {
      client: { select: { id: true } },
      lines: {
        select: {
          description: true,
          quantity: true,
          unitPrice: true,
          vatRate: true,
        },
      },
      rectifications: { select: { id: true, fullNumber: true } },
    },
  })

  if (!original) {
    return { ok: false, error: 'Factura original no encontrada' }
  }

  // 2. Validation: cannot rectify draft
  if (original.status === 'draft') {
    return { ok: false, error: 'No se pueden rectificar borradores' }
  }

  // 3. Validation: cannot rectify cancelled
  if (original.status === 'cancelled') {
    return { ok: false, error: 'No se pueden rectificar facturas anuladas' }
  }

  // 4. Validation: cannot rectify already rectified
  if (original.rectifications.length > 0) {
    const existing = original.rectifications[0]!
    return {
      ok: false,
      error: `Esta factura ya tiene una rectificativa (${existing.fullNumber})`,
    }
  }

  // 5. Find series "R" for this tenant
  const seriesR = await prisma.invoiceSeries.findFirst({
    where: { tenantId, code: 'R', isActive: true },
  })
  if (!seriesR) {
    return {
      ok: false,
      error: 'No existe la serie de rectificativas (R). Contacta con soporte.',
    }
  }

  // 6. Calculate totals (lines may have negative prices for credit notes)
  const invoiceTotals = calculateInvoiceTotals(
    lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice, vatRate: l.vatRate })),
  )

  const linesWithAmounts = lines.map((line) => {
    const sub = roundCents(line.quantity * line.unitPrice)
    const vat = roundCents(sub * (line.vatRate / 100))
    return {
      ...line,
      lineSubtotal: sub,
      lineVatAmount: vat,
      lineTotalAmount: roundCents(sub + vat),
    }
  })

  // 7. Create rectificativa inside transaction
  const result = await prisma.$transaction(async (tx) => {
    const number = seriesR.nextNumber
    const year = new Date().getFullYear()
    const fullNumber = `${seriesR.code}-${year}-${String(number).padStart(4, '0')}`

    const invoice = await tx.invoice.create({
      data: {
        tenantId,
        clientId: original.clientId,
        seriesId: seriesR.id,
        number,
        fullNumber,
        type: type as InvoiceType,
        issuedAt: new Date(),
        dueAt: null,
        status: 'draft',
        subtotal: invoiceTotals.subtotal,
        vatAmount: invoiceTotals.vatTotal,
        totalAmount: invoiceTotals.total,
        rectifiedId: original.id,
        rectificationReason: reason,
        notes: `Rectificativa ${type} — ${RECTIFICATIVA_LABELS[type] ?? type}\nMotivo: ${reason}`,
      },
      select: { id: true },
    })

    await tx.invoiceLine.createMany({
      data: linesWithAmounts.map((line, idx) => ({
        invoiceId: invoice.id,
        itemId: null,
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

    await tx.invoiceSeries.update({
      where: { id: seriesR.id },
      data: { nextNumber: { increment: 1 } },
    })

    return invoice
  })

  revalidatePath('/facturas')
  revalidatePath(`/facturas/${originalInvoiceId}`)
  return { ok: true, data: { id: result.id } }
}
