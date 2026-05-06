'use server'

import { prisma } from '@nexo/prisma'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@nexo/core-auth'
import { fiscalDataSchema, createSeriesSchema, updateSeriesSchema } from './settings-schema'

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

async function getCtx() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) return null
  return { user, tenantId, supabase }
}

// ─────────────────────────────────────────────────────────────
// DATOS FISCALES
// ─────────────────────────────────────────────────────────────

export async function saveFiscalData(raw: unknown): Promise<ActionResult> {
  const ctx = await getCtx()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const parsed = fiscalDataSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  await prisma.tenant.update({
    where: { id: ctx.tenantId },
    data: parsed.data,
  })

  revalidatePath('/settings/datos-fiscales')
  return { ok: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// LOGO (stored in BrandingConfig)
// ─────────────────────────────────────────────────────────────

export async function uploadLogo(
  formData: FormData,
): Promise<ActionResult<{ logoUrl: string }>> {
  const ctx = await getCtx()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const file = formData.get('file') as File | null
  if (!file) return { ok: false, error: 'No se subió ningún archivo' }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { ok: false, error: 'Formato no permitido. Usa PNG, JPG, SVG o WebP' }
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, error: 'El archivo supera el límite de 2 MB' }
  }

  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${ctx.tenantId}/logo.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await ctx.supabase.storage
    .from('tenant-logos')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    return { ok: false, error: `Error al subir: ${uploadError.message}` }
  }

  const {
    data: { publicUrl },
  } = ctx.supabase.storage.from('tenant-logos').getPublicUrl(path)

  const finalUrl = `${publicUrl}?v=${Date.now()}`

  await prisma.brandingConfig.upsert({
    where: { tenantId: ctx.tenantId },
    update: { logoUrl: finalUrl },
    create: { tenantId: ctx.tenantId, logoUrl: finalUrl },
  })

  revalidatePath('/settings/logo')
  return { ok: true, data: { logoUrl: finalUrl } }
}

export async function deleteLogo(): Promise<ActionResult> {
  const ctx = await getCtx()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const branding = await prisma.brandingConfig.findUnique({
    where: { tenantId: ctx.tenantId },
    select: { logoUrl: true },
  })
  if (!branding?.logoUrl) return { ok: true, data: undefined }

  const baseUrl = branding.logoUrl.split('?')[0] ?? ''
  const storagePath = baseUrl.split('/tenant-logos/')[1]
  if (storagePath) {
    await ctx.supabase.storage.from('tenant-logos').remove([storagePath])
  }

  await prisma.brandingConfig.update({
    where: { tenantId: ctx.tenantId },
    data: { logoUrl: null },
  })

  revalidatePath('/settings/logo')
  return { ok: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// SERIES
// ─────────────────────────────────────────────────────────────

export async function createSeries(raw: unknown): Promise<ActionResult> {
  const ctx = await getCtx()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const parsed = createSeriesSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const existing = await prisma.invoiceSeries.findFirst({
    where: { tenantId: ctx.tenantId, code: parsed.data.code },
  })
  if (existing) {
    return {
      ok: false,
      error: `Ya existe una serie con el código ${parsed.data.code}`,
      fieldErrors: { code: ['Código ya en uso'] },
    }
  }

  await prisma.invoiceSeries.create({
    data: {
      tenantId: ctx.tenantId,
      code: parsed.data.code,
      name: parsed.data.name,
      nextNumber: parsed.data.nextNumber,
    },
  })

  revalidatePath('/settings/series')
  return { ok: true, data: undefined }
}

export async function updateSeries(raw: unknown): Promise<ActionResult> {
  const ctx = await getCtx()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const parsed = updateSeriesSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const series = await prisma.invoiceSeries.findFirst({
    where: { id: parsed.data.id, tenantId: ctx.tenantId },
  })
  if (!series) return { ok: false, error: 'Serie no encontrada' }

  if (parsed.data.nextNumber !== undefined) {
    const lastIssued = await prisma.invoice.findFirst({
      where: { tenantId: ctx.tenantId, seriesId: parsed.data.id },
      orderBy: { number: 'desc' },
      select: { number: true },
    })
    if (lastIssued && parsed.data.nextNumber <= lastIssued.number) {
      return {
        ok: false,
        error: `El próximo número debe ser mayor que ${lastIssued.number} (última factura emitida en esta serie)`,
        fieldErrors: { nextNumber: [`Debe ser > ${lastIssued.number}`] },
      }
    }
  }

  await prisma.invoiceSeries.update({
    where: { id: parsed.data.id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.nextNumber !== undefined && { nextNumber: parsed.data.nextNumber }),
    },
  })

  revalidatePath('/settings/series')
  return { ok: true, data: undefined }
}

export async function deactivateSeries(seriesId: string): Promise<ActionResult> {
  const ctx = await getCtx()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const series = await prisma.invoiceSeries.findFirst({
    where: { id: seriesId, tenantId: ctx.tenantId },
  })
  if (!series) return { ok: false, error: 'Serie no encontrada' }

  const activeCount = await prisma.invoiceSeries.count({
    where: { tenantId: ctx.tenantId, isActive: true },
  })
  if (activeCount <= 1) {
    return { ok: false, error: 'Debe haber al menos una serie activa' }
  }

  await prisma.invoiceSeries.update({
    where: { id: seriesId },
    data: { isActive: false },
  })

  revalidatePath('/settings/series')
  return { ok: true, data: undefined }
}

export async function activateSeries(seriesId: string): Promise<ActionResult> {
  const ctx = await getCtx()
  if (!ctx) return { ok: false, error: 'No autenticado' }

  const series = await prisma.invoiceSeries.findFirst({
    where: { id: seriesId, tenantId: ctx.tenantId },
  })
  if (!series) return { ok: false, error: 'Serie no encontrada' }

  await prisma.invoiceSeries.update({
    where: { id: seriesId },
    data: { isActive: true },
  })

  revalidatePath('/settings/series')
  return { ok: true, data: undefined }
}
