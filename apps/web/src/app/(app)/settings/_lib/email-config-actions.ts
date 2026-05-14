'use server'

import { prisma } from '@nexo/prisma'
import { requireOwnerOrAdminAction } from '@/lib/auth/role-guard'
import { revalidatePath } from 'next/cache'
import { encryptSecret, decryptSecret } from '@/lib/crypto/tenant-secrets'
import { Resend } from 'resend'
import { z } from 'zod'

// ── Types ───────────────────────────────────────────────────────────────────

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

// ── Schema ──────────────────────────────────────────────────────────────────

const emailConfigSchema = z
  .object({
    provider: z.enum(['resend', 'sendgrid', 'smtp']),
    from: z.string().email('Email de envío inválido').optional().or(z.literal('')),
    fromName: z.string().max(100).optional().or(z.literal('')),
    replyTo: z.string().email('Reply-to inválido').optional().or(z.literal('')),
    apiKey: z.string().optional().or(z.literal('')),
    smtpHost: z.string().optional().or(z.literal('')),
    smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
    smtpUser: z.string().optional().or(z.literal('')),
    smtpPass: z.string().optional().or(z.literal('')),
    smtpSecure: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.provider === 'smtp') {
        return !!data.smtpHost && !!data.smtpPort && !!data.smtpUser
      }
      return true
    },
    {
      message: 'Host, puerto y usuario SMTP son obligatorios',
      path: ['smtpHost'],
    },
  )

export type EmailConfigInput = z.infer<typeof emailConfigSchema>

// ── Save config ─────────────────────────────────────────────────────────────

export async function saveEmailConfig(
  raw: unknown,
): Promise<ActionResult<{ message: string }>> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return { ok: false, error: 'No tienes permiso' }

  const parsed = emailConfigSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const data = parsed.data

  try {
    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: {
        emailProvider: data.provider,
        emailFrom: data.from || null,
        emailFromName: data.fromName || null,
        emailReplyTo: data.replyTo || null,
        emailApiKey: data.apiKey ? encryptSecret(data.apiKey) : null,
        smtpHost: data.smtpHost || null,
        smtpPort: data.smtpPort ?? null,
        smtpUser: data.smtpUser || null,
        smtpPass: data.smtpPass ? encryptSecret(data.smtpPass) : null,
        smtpSecure: data.smtpSecure,
      },
    })

    revalidatePath('/settings/email')
    return { ok: true, data: { message: 'Configuración guardada' } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[saveEmailConfig] error:', msg)
    return { ok: false, error: `Error al guardar: ${msg}` }
  }
}

// ── Test email ──────────────────────────────────────────────────────────────

export async function testEmailConfig(): Promise<ActionResult<{ message: string }>> {
  const auth = await requireOwnerOrAdminAction()
  if (!auth) return { ok: false, error: 'No tienes permiso' }

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenantId },
    select: {
      emailProvider: true,
      emailFrom: true,
      emailFromName: true,
      emailApiKey: true,
      smtpHost: true,
      smtpPort: true,
      smtpUser: true,
      smtpPass: true,
      smtpSecure: true,
    },
  })
  if (!tenant) return { ok: false, error: 'Tenant no encontrado' }

  const user = await prisma.user.findFirst({
    where: { tenantId: auth.tenantId },
    select: { email: true },
    orderBy: { createdAt: 'asc' },
  })
  if (!user?.email) {
    return { ok: false, error: 'No hay email de usuario para enviar el test' }
  }

  const from = tenant.emailFrom || process.env.EMAIL_FROM || 'facturas@nexo-billing.app'
  const fromName = tenant.emailFromName || 'Nexo Billing'

  try {
    if (tenant.emailProvider === 'resend' || !tenant.emailProvider) {
      const apiKey = tenant.emailApiKey
        ? decryptSecret(tenant.emailApiKey)
        : process.env.RESEND_API_KEY
      if (!apiKey) return { ok: false, error: 'API Key de Resend no configurada' }

      const resend = new Resend(apiKey)
      const result = await resend.emails.send({
        from: `${fromName} <${from}>`,
        to: user.email,
        subject: 'Email de prueba — Nexo Billing',
        html: `<p>Este es un email de prueba enviado desde tu configuración de Nexo Billing.</p>`,
      })
      if (result.error) {
        return { ok: false, error: `Resend: ${result.error.message}` }
      }
    } else {
      return { ok: false, error: 'Proveedor no soportado para test' }
    }

    return { ok: true, data: { message: `Email de prueba enviado a ${user.email}` } }
  } catch (err) {
    console.error('[testEmailConfig] error:', err)
    return { ok: false, error: 'Error al enviar email de prueba' }
  }
}
