'use server'

import { prisma } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createReceiptSchema } from './receipt-schema'
import { calculateInvoiceTotals } from '../../facturas/_lib/invoice-totals'
import { checkCanCreateInvoice } from '@/lib/subscription-gate'

type ReceiptStatusValue = 'draft' | 'issued' | 'cancelled'

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

const ALLOWED_TRANSITIONS: Partial<Record<ReceiptStatusValue, ReceiptStatusValue[]>> = {
  draft: ['issued', 'cancelled'],
  issued: ['cancelled'],
}

export async function createReceiptDraft(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const { tenantId } = await requireAuth()

  const canCreate = await checkCanCreateInvoice(tenantId)
  if (!canCreate) {
    return {
      ok: false,
      error: 'Tu periodo de prueba ha finalizado. Activa tu suscripción para continuar.',
    }
  }

  const parsed = createReceiptSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { clientId, issuedAt, notes, termsConditions, lines } = parsed.data

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
    const existingSeries = await tx.invoiceSeries.findFirst({
      where: { tenantId, code: 'R' },
    })

    let num: number

    if (!existingSeries) {
      await tx.invoiceSeries.create({
        data: {
          tenantId,
          code: 'R',
          name: 'Recibos',
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
    const number = `R-${year}-${String(num).padStart(4, '0')}`

    const receipt = await tx.receipt.create({
      data: {
        tenantId,
        clientId,
        number,
        status: 'draft',
        issuedAt,
        subtotal: totals.subtotal,
        vatAmount: totals.vatTotal,
        totalAmount: totals.total,
        notes: notes ?? null,
        termsConditions: termsConditions ?? null,
      },
      select: { id: true },
    })

    await tx.receiptLine.createMany({
      data: linesWithAmounts.map((line, idx) => ({
        receiptId: receipt.id,
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

    return receipt
  })

  revalidatePath('/recibos')
  return { ok: true, data: { id: result.id } }
}

export async function updateReceiptStatus(
  receiptId: string,
  newStatus: ReceiptStatusValue,
): Promise<SimpleResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, tenantId: ctx.tenantId },
    select: { id: true, status: true },
  })
  if (!receipt) return { ok: false, error: 'Recibo no encontrado' }

  const allowed = ALLOWED_TRANSITIONS[receipt.status as ReceiptStatusValue] ?? []
  if (!allowed.includes(newStatus)) {
    return { ok: false, error: `No se puede cambiar a estado "${newStatus}"` }
  }

  const now = new Date()
  await prisma.receipt.update({
    where: { id: receiptId },
    data: {
      status: newStatus,
      ...(newStatus === 'issued' ? { issuedAtDate: now } : {}),
      ...(newStatus === 'cancelled' ? { cancelledAt: now } : {}),
    },
  })

  revalidatePath('/recibos')
  revalidatePath(`/recibos/${receiptId}`)
  return { ok: true }
}

export async function deleteReceiptDraft(receiptId: string): Promise<SimpleResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, tenantId: ctx.tenantId },
    select: { id: true, status: true },
  })
  if (!receipt) return { ok: false, error: 'Recibo no encontrado' }
  if (receipt.status !== 'draft') return { ok: false, error: 'Solo borradores pueden eliminarse' }

  await prisma.$transaction(async (tx) => {
    await tx.receiptLine.deleteMany({ where: { receiptId } })
    await tx.receipt.delete({ where: { id: receiptId } })
  })

  revalidatePath('/recibos')
  redirect('/recibos')
}
