'use server'

import { prisma, RecurringStatus } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createContractSchema } from './recurring-schema'
import { emitDueInvoices } from '@/lib/recurring/emit-due-invoices'

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
  return { tenantId }
}

function roundCents(v: number): number {
  return Math.round(v * 100) / 100
}

export async function createContract(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const { tenantId } = await requireAuth()

  const parsed = createContractSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { clientId, name, frequency, startDate, endDate, seriesCode, notes, lines } = parsed.data

  const [client, series] = await Promise.all([
    prisma.client.findFirst({ where: { id: clientId, tenantId, isActive: true } }),
    prisma.invoiceSeries.findFirst({ where: { tenantId, code: seriesCode, isActive: true } }),
  ])
  if (!client) return { ok: false, error: 'Cliente no válido' }
  if (!series) return { ok: false, error: `Serie "${seriesCode}" no encontrada` }

  let subtotal = 0
  let taxAmount = 0

  const linesWithTotals = lines.map((line, idx) => {
    const lineSub = roundCents(line.quantity * line.unitPrice)
    const lineVat = roundCents(lineSub * (line.taxRate / 100))
    subtotal += lineSub
    taxAmount += lineVat
    return { ...line, total: roundCents(lineSub + lineVat), position: idx }
  })

  subtotal = roundCents(subtotal)
  taxAmount = roundCents(taxAmount)
  const total = roundCents(subtotal + taxAmount)

  const contract = await prisma.recurringContract.create({
    data: {
      tenantId,
      clientId,
      name,
      frequency,
      startDate,
      endDate: endDate ?? null,
      nextBillingAt: startDate,
      seriesCode,
      notes: notes ?? null,
      subtotal,
      taxAmount,
      total,
      lines: {
        create: linesWithTotals.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
          total: l.total,
          position: l.position,
        })),
      },
    },
    select: { id: true },
  })

  revalidatePath('/recurrentes')
  return { ok: true, data: { id: contract.id } }
}

export async function updateContract(
  id: string,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const { tenantId } = await requireAuth()

  const existing = await prisma.recurringContract.findFirst({
    where: { id, tenantId },
    select: { id: true, status: true },
  })
  if (!existing) return { ok: false, error: 'Contrato no encontrado' }
  if (
    existing.status !== RecurringStatus.ACTIVE &&
    existing.status !== RecurringStatus.PAUSED
  ) {
    return { ok: false, error: 'Solo contratos activos o pausados pueden editarse' }
  }

  const parsed = createContractSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { clientId, name, frequency, startDate, endDate, seriesCode, notes, lines } = parsed.data

  const [client, series] = await Promise.all([
    prisma.client.findFirst({ where: { id: clientId, tenantId, isActive: true } }),
    prisma.invoiceSeries.findFirst({ where: { tenantId, code: seriesCode, isActive: true } }),
  ])
  if (!client) return { ok: false, error: 'Cliente no válido' }
  if (!series) return { ok: false, error: `Serie "${seriesCode}" no encontrada` }

  let subtotal = 0
  let taxAmount = 0

  const linesWithTotals = lines.map((line, idx) => {
    const lineSub = roundCents(line.quantity * line.unitPrice)
    const lineVat = roundCents(lineSub * (line.taxRate / 100))
    subtotal += lineSub
    taxAmount += lineVat
    return { ...line, total: roundCents(lineSub + lineVat), position: idx }
  })

  subtotal = roundCents(subtotal)
  taxAmount = roundCents(taxAmount)
  const total = roundCents(subtotal + taxAmount)

  await prisma.$transaction(async (tx) => {
    await tx.recurringLine.deleteMany({ where: { contractId: id } })
    await tx.recurringContract.update({
      where: { id },
      data: {
        clientId,
        name,
        frequency,
        startDate,
        endDate: endDate ?? null,
        seriesCode,
        notes: notes ?? null,
        subtotal,
        taxAmount,
        total,
        lines: {
          create: linesWithTotals.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate,
            total: l.total,
            position: l.position,
          })),
        },
      },
    })
  })

  revalidatePath('/recurrentes')
  revalidatePath(`/recurrentes/${id}`)
  return { ok: true, data: { id } }
}

export async function pauseContract(id: string): Promise<ActionResult> {
  const { tenantId } = await requireAuth()

  const contract = await prisma.recurringContract.findFirst({
    where: { id, tenantId },
    select: { id: true, status: true },
  })
  if (!contract) return { ok: false, error: 'Contrato no encontrado' }
  if (contract.status !== RecurringStatus.ACTIVE) {
    return { ok: false, error: 'Solo contratos activos pueden pausarse' }
  }

  await prisma.recurringContract.update({
    where: { id },
    data: { status: RecurringStatus.PAUSED },
  })

  revalidatePath('/recurrentes')
  revalidatePath(`/recurrentes/${id}`)
  return { ok: true, data: undefined }
}

export async function resumeContract(id: string): Promise<ActionResult> {
  const { tenantId } = await requireAuth()

  const contract = await prisma.recurringContract.findFirst({
    where: { id, tenantId },
    select: { id: true, status: true },
  })
  if (!contract) return { ok: false, error: 'Contrato no encontrado' }
  if (contract.status !== RecurringStatus.PAUSED) {
    return { ok: false, error: 'Solo contratos pausados pueden reanudarse' }
  }

  await prisma.recurringContract.update({
    where: { id },
    data: { status: RecurringStatus.ACTIVE },
  })

  revalidatePath('/recurrentes')
  revalidatePath(`/recurrentes/${id}`)
  return { ok: true, data: undefined }
}

export async function cancelContract(id: string): Promise<ActionResult> {
  const { tenantId } = await requireAuth()

  const contract = await prisma.recurringContract.findFirst({
    where: { id, tenantId },
    select: { id: true, status: true },
  })
  if (!contract) return { ok: false, error: 'Contrato no encontrado' }
  if (contract.status === RecurringStatus.CANCELLED) {
    return { ok: false, error: 'El contrato ya está cancelado' }
  }

  await prisma.recurringContract.update({
    where: { id },
    data: { status: RecurringStatus.CANCELLED },
  })

  revalidatePath('/recurrentes')
  revalidatePath(`/recurrentes/${id}`)
  return { ok: true, data: undefined }
}

export async function emitNow(id: string): Promise<ActionResult<{ invoiceId: string }>> {
  const { tenantId } = await requireAuth()

  const contract = await prisma.recurringContract.findFirst({
    where: { id, tenantId },
    select: { id: true, status: true },
  })
  if (!contract) return { ok: false, error: 'Contrato no encontrado' }
  if (contract.status !== RecurringStatus.ACTIVE && contract.status !== RecurringStatus.PAUSED) {
    return { ok: false, error: 'Solo contratos activos o pausados pueden emitirse' }
  }

  // Force nextBillingAt to now so emitDueInvoices picks it up
  await prisma.recurringContract.update({
    where: { id },
    data: { nextBillingAt: new Date(), status: RecurringStatus.ACTIVE },
  })

  const result = await emitDueInvoices(tenantId, id)
  const invoiceId = result.invoiceIds[0]
  if (!invoiceId) return { ok: false, error: 'No se pudo emitir la factura' }

  revalidatePath('/facturas')
  revalidatePath('/recurrentes')
  revalidatePath(`/recurrentes/${id}`)
  return { ok: true, data: { invoiceId } }
}
