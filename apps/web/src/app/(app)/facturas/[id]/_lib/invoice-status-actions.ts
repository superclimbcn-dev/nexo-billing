'use server'

import { prisma, InvoiceStatus } from '@nexo/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireOwnerOrAdminAction } from '@/lib/auth/role-guard'

export async function syncOverdueInvoices(): Promise<void> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return
  await prisma.invoice.updateMany({
    where: {
      tenantId: auth.tenantId,
      status: InvoiceStatus.sent,
      dueAt: { lt: new Date() },
    },
    data: { status: InvoiceStatus.overdue },
  })
}

type ActionResult = { ok: true } | { ok: false; error: string }

export async function markInvoiceAsSent(invoiceId: string): Promise<ActionResult> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return { ok: false, error: 'No tienes permiso para realizar esta acción' }
  const ctx = { tenantId: auth.tenantId }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: ctx.tenantId },
    select: { id: true, status: true },
  })
  if (!invoice) return { ok: false, error: 'Factura no encontrada' }
  if (invoice.status !== 'draft') {
    return { ok: false, error: 'Solo borradores pueden marcarse como enviadas' }
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'sent' },
  })

  revalidatePath('/facturas')
  revalidatePath(`/facturas/${invoiceId}`)
  return { ok: true }
}

export async function markInvoiceAsPaid(invoiceId: string): Promise<ActionResult> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return { ok: false, error: 'No tienes permiso para realizar esta acción' }
  const ctx = { tenantId: auth.tenantId }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: ctx.tenantId },
    select: { id: true, status: true, totalAmount: true },
  })
  if (!invoice) return { ok: false, error: 'Factura no encontrada' }
  if (!['sent', 'overdue', 'partially_paid'].includes(invoice.status)) {
    return { ok: false, error: 'Esta factura no puede marcarse como pagada' }
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'paid',
      paidAmount: invoice.totalAmount,
    },
  })

  revalidatePath('/facturas')
  revalidatePath(`/facturas/${invoiceId}`)
  return { ok: true }
}

export async function cancelInvoice(invoiceId: string): Promise<ActionResult> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return { ok: false, error: 'No tienes permiso para realizar esta acción' }
  const ctx = { tenantId: auth.tenantId }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: ctx.tenantId },
    select: { id: true, status: true },
  })
  if (!invoice) return { ok: false, error: 'Factura no encontrada' }
  if (invoice.status === 'cancelled') {
    return { ok: false, error: 'La factura ya está anulada' }
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'cancelled' },
  })

  revalidatePath('/facturas')
  revalidatePath(`/facturas/${invoiceId}`)
  return { ok: true }
}

export async function deleteDraftInvoice(invoiceId: string): Promise<ActionResult> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return { ok: false, error: 'No tienes permiso para realizar esta acción' }
  const ctx = { tenantId: auth.tenantId }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: ctx.tenantId },
    select: { id: true, status: true },
  })
  if (!invoice) return { ok: false, error: 'Factura no encontrada' }
  if (invoice.status !== 'draft') {
    return { ok: false, error: 'Solo borradores pueden eliminarse' }
  }

  await prisma.$transaction(async (tx) => {
    await tx.invoiceLine.deleteMany({ where: { invoiceId } })
    await tx.invoice.delete({ where: { id: invoiceId } })
  })

  revalidatePath('/facturas')
  redirect('/facturas')
}
