'use server'

import { prisma, ExpenseCategory } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { expenseSchema, type ExpenseInput } from './expense-schema'
import { requireOwnerOrAdminAction } from '@/lib/auth/role-guard'

export interface ExpenseFilters {
  category?: ExpenseCategory
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
}

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

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

export async function createExpense(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireOwnerOrAdminAction()
  if (!ctx) return { ok: false, error: 'No tienes permiso para realizar esta acción' }

  const parsed = expenseSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
    }
  }

  const data = parsed.data

  try {
    const created = await prisma.expense.create({
      data: {
        tenantId: ctx.tenantId,
        totalAmount: data.amount,
        subtotal: data.amount,
        vatAmount: 0,
        issuedAt: new Date(data.date),
        category: data.category,
        notes: data.description ?? null,
        vendor: data.vendor ?? null,
        status: 'paid',
      },
      select: { id: true },
    })

    revalidatePath('/gastos')
    return { ok: true, data: { id: created.id } }
  } catch (err) {
    console.error('[createExpense] error:', err)
    return { ok: false, error: 'Error al crear el gasto' }
  }
}

export async function updateExpense(
  id: string,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireOwnerOrAdminAction()
  if (!ctx) return { ok: false, error: 'No tienes permiso para realizar esta acción' }

  const parsed = expenseSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: 'Datos inválidos' }
  }

  const data = parsed.data

  const owned = await prisma.expense.findFirst({
    where: { id, tenantId: ctx.tenantId },
  })
  if (!owned) return { ok: false, error: 'Gasto no encontrado' }

  try {
    const updated = await prisma.expense.update({
      where: { id },
      data: {
        totalAmount: data.amount,
        subtotal: data.amount,
        issuedAt: new Date(data.date),
        category: data.category,
        notes: data.description ?? null,
        vendor: data.vendor ?? null,
      },
      select: { id: true },
    })

    revalidatePath('/gastos')
    return { ok: true, data: { id: updated.id } }
  } catch (err) {
    console.error('[updateExpense] error:', err)
    return { ok: false, error: 'Error al actualizar el gasto' }
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const ctx = await requireOwnerOrAdminAction()
  if (!ctx) return { ok: false, error: 'No tienes permiso para realizar esta acción' }

  const owned = await prisma.expense.findFirst({
    where: { id, tenantId: ctx.tenantId },
  })
  if (!owned) return { ok: false, error: 'Gasto no encontrado' }

  try {
    await prisma.expense.delete({ where: { id } })
    revalidatePath('/gastos')
    return { ok: true, data: undefined }
  } catch (err) {
    console.error('[deleteExpense] error:', err)
    return { ok: false, error: 'Error al eliminar el gasto' }
  }
}

export async function listExpenses(
  filters?: ExpenseFilters,
): Promise<ActionResult<Array<{
  id: string
  totalAmount: number
  issuedAt: Date
  category: ExpenseCategory | null
  notes: string | null
  vendor: string | null
  attachmentUrl: string | null
}>>> {
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const where: {
    tenantId: string
    category?: ExpenseCategory
    issuedAt?: { gte?: Date; lte?: Date }
    totalAmount?: { gte?: number; lte?: number }
  } = {
    tenantId: ctx.tenantId,
  }

  if (filters?.category) {
    where.category = filters.category
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.issuedAt = {}
    if (filters.dateFrom) where.issuedAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.issuedAt.lte = new Date(filters.dateTo)
  }

  if (filters?.minAmount !== undefined || filters?.maxAmount !== undefined) {
    where.totalAmount = {}
    if (filters.minAmount !== undefined) where.totalAmount.gte = filters.minAmount
    if (filters.maxAmount !== undefined) where.totalAmount.lte = filters.maxAmount
  }

  try {
    const items = await prisma.expense.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        totalAmount: true,
        issuedAt: true,
        category: true,
        notes: true,
        vendor: true,
        attachmentUrl: true,
      },
    })

    return {
      ok: true,
      data: items.map((it) => ({
        ...it,
        totalAmount: Number(it.totalAmount),
      })),
    }
  } catch (err) {
    console.error('[listExpenses] error:', err)
    return { ok: false, error: 'Error al listar los gastos' }
  }
}

export async function getMonthlyTotal(): Promise<ActionResult<number>> {
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  try {
    const result = await prisma.expense.aggregate({
      where: {
        tenantId: ctx.tenantId,
        issuedAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { totalAmount: true },
    })

    return { ok: true, data: Number(result._sum.totalAmount ?? 0) }
  } catch (err) {
    console.error('[getMonthlyTotal] error:', err)
    return { ok: false, error: 'Error al calcular el total' }
  }
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
]
const MAX_SIZE_MB = 5

export async function uploadReceipt(formData: FormData): Promise<ActionResult<string>> {
  const ctx = await getAuthContext()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const file = formData.get('file') as File | null
  const expenseId = formData.get('expenseId') as string | null

  if (!file || !expenseId) {
    return { ok: false, error: 'Falta el archivo o el ID del gasto' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: 'Formato no válido. Usa JPG, PNG o PDF.' }
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { ok: false, error: 'El archivo excede 5MB.' }
  }

  const owned = await prisma.expense.findFirst({
    where: { id: expenseId, tenantId: ctx.tenantId },
  })
  if (!owned) return { ok: false, error: 'Gasto no encontrado' }

  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    )
    const ext = file.name.split('.').pop() ?? 'bin'
    const filename = `${Date.now()}.${ext}`
    const path = `${ctx.tenantId}/${expenseId}/${filename}`

    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await admin.storage
      .from('receipts')
      .upload(path, bytes, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[uploadReceipt] storage error:', uploadError)
      return { ok: false, error: 'Error al subir el recibo.' }
    }

    const { data: publicUrl } = admin.storage.from('receipts').getPublicUrl(path)

    await prisma.expense.update({
      where: { id: expenseId },
      data: { attachmentUrl: publicUrl.publicUrl },
    })

    revalidatePath('/gastos')
    return { ok: true, data: publicUrl.publicUrl }
  } catch (err) {
    console.error('[uploadReceipt] error:', err)
    return { ok: false, error: 'Error al subir el recibo.' }
  }
}
