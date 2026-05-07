'use server'

import { prisma, InvoiceStatus } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function syncOverdueInvoices(tenantId: string): Promise<void> {
  await prisma.invoice.updateMany({
    where: {
      tenantId,
      status: InvoiceStatus.sent,
      dueAt: { lt: new Date() },
    },
    data: { status: InvoiceStatus.overdue },
  })
}

type ActionResult = { ok: true } | { ok: false; error: string }

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

export async function markInvoiceAsSent(invoiceId: string): Promise<ActionResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false, error: 'No autenticado' }

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
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false, error: 'No autenticado' }

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
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false, error: 'No autenticado' }

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
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false, error: 'No autenticado' }

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
