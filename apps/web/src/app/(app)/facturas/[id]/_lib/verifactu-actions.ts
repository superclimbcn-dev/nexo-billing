'use server'

import { prisma, Prisma } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'
import { revalidatePath } from 'next/cache'
import {
  getVerifactuProvider,
  computeRecordHash,
  generateAEATQRUrlFromInvoice,
  type InvoiceRecordData,
  type VerifactuRecordType,
  type VerifactuResult,
  type VerifactuStatus,
  type InvoiceData,
} from '@nexo/verifactu'

type ActionResult = { ok: true; csv: string } | { ok: false; error: string }

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

function mapPrismaRecord(record: {
  id: string
  tenantId: string
  invoiceId: string
  type: string
  hash: string
  previousHash: string | null
  canonicalXml: string
  qrUrl: string | null
  sentAt: Date | null
  aeatResponse: Prisma.JsonValue
  status: string
  createdAt: Date
}): InvoiceRecordData {
  return {
    id: record.id,
    tenantId: record.tenantId,
    invoiceId: record.invoiceId,
    type: record.type as VerifactuRecordType,
    hash: record.hash,
    previousHash: record.previousHash,
    canonicalXml: record.canonicalXml,
    qrUrl: record.qrUrl,
    sentAt: record.sentAt,
    aeatResponse: record.aeatResponse,
    status: record.status as VerifactuStatus,
    createdAt: record.createdAt,
  }
}

function mapInvoiceToVerifactuData(invoice: {
  id: string
  tenantId: string
  type: string
  fullNumber: string
  issuedAt: Date
  dueAt: Date | null
  status: string
  subtotal: Prisma.Decimal
  vatAmount: Prisma.Decimal
  totalAmount: Prisma.Decimal
  notes: string | null
  tenant: { nif: string | null; legalName: string | null; name: string }
  client: { nif: string; name: string }
  lines: Array<{
    description: string
    quantity: Prisma.Decimal
    unitPrice: Prisma.Decimal
    vatRate: Prisma.Decimal
    subtotal: Prisma.Decimal
    vatAmount: Prisma.Decimal
    totalAmount: Prisma.Decimal
  }>
}): InvoiceData {
  return {
    id: invoice.id,
    tenantId: invoice.tenantId,
    tenantNif: invoice.tenant.nif ?? '',
    tenantName: invoice.tenant.legalName ?? invoice.tenant.name,
    invoiceType: invoice.type || 'F1',
    fullNumber: invoice.fullNumber,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
    status: invoice.status,
    subtotal: Number(invoice.subtotal),
    vatAmount: Number(invoice.vatAmount),
    totalAmount: Number(invoice.totalAmount),
    notes: invoice.notes,
    clientNif: invoice.client.nif,
    clientName: invoice.client.name,
    lines: invoice.lines.map((line) => ({
      description: line.description,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      vatRate: Number(line.vatRate),
      subtotal: Number(line.subtotal),
      vatAmount: Number(line.vatAmount),
      totalAmount: Number(line.totalAmount),
    })),
  }
}

export async function submitToVerifactu(invoiceId: string): Promise<ActionResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: ctx.tenantId },
    select: {
      id: true,
      tenantId: true,
      type: true,
      fullNumber: true,
      issuedAt: true,
      dueAt: true,
      status: true,
      subtotal: true,
      vatAmount: true,
      totalAmount: true,
      notes: true,
      client: { select: { id: true, name: true, nif: true } },
      tenant: { select: { nif: true, legalName: true, name: true, verifactuProvider: true } },
      lines: {
        select: {
          description: true,
          quantity: true,
          unitPrice: true,
          vatRate: true,
          subtotal: true,
          vatAmount: true,
          totalAmount: true,
        },
      },
    },
  })

  if (!invoice) return { ok: false, error: 'Factura no encontrada' }
  if (invoice.status === 'draft') {
    return { ok: false, error: 'No se puede enviar un borrador a la AEAT' }
  }
  if (!invoice.client.nif || invoice.client.nif.trim() === '') {
    return { ok: false, error: 'El cliente debe tener un NIF válido para enviar a la AEAT' }
  }

  const existing = await prisma.invoiceRecord.findFirst({
    where: { invoiceId, tenantId: ctx.tenantId },
  })
  if (existing) {
    return { ok: false, error: 'Esta factura ya ha sido enviada a la AEAT' }
  }

  const invoiceData = mapInvoiceToVerifactuData(invoice)
  const provider = getVerifactuProvider(invoice.tenant)

  // Compute hash with chaining
  const lastRecord = await prisma.invoiceRecord.findFirst({
    where: { tenantId: ctx.tenantId },
    orderBy: { createdAt: 'desc' },
  })
  const previousHash = lastRecord?.hash ?? null

  const hashPayload = {
    invoiceId: invoice.id,
    fullNumber: invoice.fullNumber,
    issuedAt: invoice.issuedAt.toISOString(),
    totalAmount: Number(invoice.totalAmount),
    clientNif: invoice.client.nif,
  }
  const hash = computeRecordHash(hashPayload, previousHash)

  let result: VerifactuResult
  try {
    result = await provider.submitInvoice(invoiceData)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al contactar con AEAT'
    await prisma.invoiceRecord.create({
      data: {
        tenantId: ctx.tenantId,
        invoiceId: invoice.id,
        type: 'Alta',
        hash,
        previousHash,
        canonicalXml: '<xml/>',
        status: 'error',
        aeatResponse: { error: msg },
      },
    })
    return { ok: false, error: msg }
  }

  if (!result.success) {
    await prisma.invoiceRecord.create({
      data: {
        tenantId: ctx.tenantId,
        invoiceId: invoice.id,
        type: 'Alta',
        hash,
        previousHash,
        canonicalXml: '<xml/>',
        status: 'error',
        aeatResponse: { error: result.error },
      },
    })
    return { ok: false, error: result.error ?? 'Error al enviar a la AEAT' }
  }

  const recordData = mapPrismaRecord(
    await prisma.invoiceRecord.create({
      data: {
        tenantId: ctx.tenantId,
        invoiceId: invoice.id,
        type: 'Alta',
        hash,
        previousHash,
        canonicalXml: '<xml/>',
        status: 'accepted',
        sentAt: new Date(),
      },
    }),
  )

  const qrUrl =
    result.qrUrl ??
    generateAEATQRUrlFromInvoice(
      invoice.tenant.nif ?? '',
      invoice.fullNumber,
      invoice.issuedAt,
      Number(invoice.totalAmount),
      false, // pruebas
    )
  await prisma.invoiceRecord.update({
    where: { id: recordData.id },
    data: { qrUrl },
  })

  revalidatePath('/facturas')
  revalidatePath(`/facturas/${invoiceId}`)
  return { ok: true, csv: result.csv ?? '' }
}

export async function cancelVerifactuInvoice(invoiceId: string): Promise<ActionResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: ctx.tenantId },
    select: {
      id: true,
      tenantId: true,
      type: true,
      fullNumber: true,
      issuedAt: true,
      dueAt: true,
      status: true,
      subtotal: true,
      vatAmount: true,
      totalAmount: true,
      notes: true,
      client: { select: { id: true, name: true, nif: true } },
      tenant: { select: { nif: true, legalName: true, name: true, verifactuProvider: true } },
      lines: {
        select: {
          description: true,
          quantity: true,
          unitPrice: true,
          vatRate: true,
          subtotal: true,
          vatAmount: true,
          totalAmount: true,
        },
      },
    },
  })

  if (!invoice) return { ok: false, error: 'Factura no encontrada' }

  const existing = await prisma.invoiceRecord.findFirst({
    where: { invoiceId, tenantId: ctx.tenantId, type: 'Alta' },
  })
  if (!existing) {
    return { ok: false, error: 'Esta factura no ha sido enviada a la AEAT' }
  }

  const invoiceData = mapInvoiceToVerifactuData(invoice)
  const provider = getVerifactuProvider(invoice.tenant)

  let result: VerifactuResult
  try {
    result = await provider.cancelInvoice(invoiceData)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al contactar con AEAT'
    return { ok: false, error: msg }
  }

  if (!result.success) {
    return { ok: false, error: result.error ?? 'Error al anular en la AEAT' }
  }

  const lastRecord = await prisma.invoiceRecord.findFirst({
    where: { tenantId: ctx.tenantId },
    orderBy: { createdAt: 'desc' },
  })
  const previousHash = lastRecord?.hash ?? null

  const hashPayload = {
    invoiceId: invoice.id,
    fullNumber: invoice.fullNumber,
    issuedAt: invoice.issuedAt.toISOString(),
    totalAmount: Number(invoice.totalAmount),
    clientNif: invoice.client.nif,
    operation: 'cancel',
  }
  const hash = computeRecordHash(hashPayload, previousHash)

  await prisma.invoiceRecord.create({
    data: {
      tenantId: ctx.tenantId,
      invoiceId: invoice.id,
      type: 'Anulacion',
      hash,
      previousHash,
      canonicalXml: '<xml/>',
      status: 'accepted',
      sentAt: new Date(),
    },
  })

  revalidatePath('/facturas')
  revalidatePath(`/facturas/${invoiceId}`)
  return { ok: true, csv: result.csv ?? '' }
}
