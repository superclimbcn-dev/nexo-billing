'use server'

import { prisma } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createInvoiceSchema } from './invoice-schema'
import { calculateInvoiceTotals } from './invoice-totals'
import { requireOwnerOrAdminAction } from '@/lib/auth/role-guard'

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
    const number = series.nextNumber
    const year = new Date(issuedAt).getFullYear()
    const fullNumber = `${series.code}-${year}-${String(number).padStart(4, '0')}`

    const invoice = await tx.invoice.create({
      data: {
        tenantId,
        clientId,
        seriesId,
        number,
        fullNumber,
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

    await tx.invoiceSeries.update({
      where: { id: seriesId },
      data: { nextNumber: { increment: 1 } },
    })

    return invoice
  })

  revalidatePath('/facturas')
  return { ok: true, data: { id: result.id } }
}
