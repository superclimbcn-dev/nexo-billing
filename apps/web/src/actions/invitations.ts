'use server'

import { redirect } from 'next/navigation'
import { createAdminClient, createServerClient } from '@nexo/core-auth'
import { AuditAction, InvitationStatus, Prisma, prisma } from '@nexo/prisma'
import { z } from 'zod'

const otpTypeSchema = z.enum(['invite', 'magiclink'])
const tokenSchema = z.string().uuid()
const MAX_ACCEPTANCE_ATTEMPTS = 3

type AcceptedMembership = { tenantId: string; role: string }

export type InvitationView = {
  email: string
  role: string
  tenantName: string
  status: string
  expiresAt: Date
}

export async function getInvitationView(token: string): Promise<InvitationView | null> {
  if (!tokenSchema.safeParse(token).success) return null
  return prisma.invitation.findUnique({
    where: { token },
    select: {
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      tenant: { select: { name: true } },
    },
  }).then((invitation) => invitation ? {
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    tenantName: invitation.tenant.name,
  } : null)
}

function fail(token: string, message: string): never {
  redirect(`/invite/${token}?error=${encodeURIComponent(message)}`)
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function persistInvitationSession(userId: string, tenantId: string, role: string) {
  const adminClient = createAdminClient()
  const { data: current, error: readError } = await adminClient.auth.admin.getUserById(userId)
  if (readError || !current.user) throw readError ?? new Error('Auth user not found')

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    app_metadata: { ...current.user.app_metadata, tenant_id: tenantId, role },
    user_metadata: { ...current.user.user_metadata, onboarding_complete: true },
  })
  if (error) throw error

  const supabase = await createServerClient()
  const { error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) throw refreshError
}

async function getAcceptedMembership(
  token: string,
  user: { id: string; email: string },
): Promise<AcceptedMembership | null> {
  const invitation = await prisma.invitation.findUnique({ where: { token } })
  if (!invitation || invitation.status !== InvitationStatus.ACCEPTED) return null
  if (invitation.acceptedBy !== user.id) throw new Error('ACCEPTED_BY_OTHER')
  if (normalizeEmail(invitation.email) !== normalizeEmail(user.email)) throw new Error('EMAIL_MISMATCH')

  const member = await prisma.user.findFirst({
    where: {
      id: user.id,
      tenantId: invitation.tenantId,
      email: { equals: invitation.email, mode: 'insensitive' },
    },
  })
  if (!member) throw new Error('MEMBERSHIP_MISSING')
  return { tenantId: member.tenantId, role: member.role }
}

async function createMembershipFromInvitation(
  token: string,
  user: { id: string; email: string; user_metadata?: Record<string, unknown> },
): Promise<AcceptedMembership> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "invitations" WHERE "token" = ${token} FOR UPDATE`
    const invitation = await tx.invitation.findUnique({ where: { token } })
    if (!invitation) throw new Error('INVITATION_NOT_FOUND')
    if (invitation.status !== InvitationStatus.PENDING) throw new Error('INVITATION_NOT_PENDING')
    if (invitation.expiresAt <= new Date()) throw new Error('INVITATION_EXPIRED')
    if (normalizeEmail(invitation.email) !== normalizeEmail(user.email)) throw new Error('EMAIL_MISMATCH')

    const byId = await tx.user.findUnique({ where: { id: user.id } })
    if (byId && byId.tenantId !== invitation.tenantId) throw new Error('FOREIGN_TENANT')
    const byEmail = await tx.user.findFirst({
      where: { email: { equals: invitation.email, mode: 'insensitive' } },
    })
    if (byEmail && (byEmail.id !== user.id || byEmail.tenantId !== invitation.tenantId)) {
      throw new Error('FOREIGN_TENANT')
    }

    const member = byId ?? await tx.user.create({
      data: {
        id: user.id,
        tenantId: invitation.tenantId,
        email: invitation.email,
        name: typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null,
        role: invitation.role,
      },
    })

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date(), acceptedBy: user.id },
    })
    await tx.auditLog.create({
      data: {
        tenantId: invitation.tenantId,
        userId: user.id,
        action: AuditAction.USER_JOINED,
        entityType: 'Invitation',
        entityId: invitation.id,
        after: { email: invitation.email, role: member.role },
      },
    })
    return { tenantId: member.tenantId, role: member.role }
  }, { isolationLevel: 'Serializable' })
}

function isSerializationConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034'
}

export async function acceptInvitation(formData: FormData) {
  const tokenValue = formData.get('invitationToken')
  const tokenHashValue = formData.get('tokenHash')
  const otpTypeValue = formData.get('otpType')
  const tokenResult = tokenSchema.safeParse(tokenValue)
  if (!tokenResult.success) redirect('/auth-error?message=Invitación+no+válida')
  const token = tokenResult.data

  const before = await prisma.invitation.findUnique({ where: { token } })
  if (!before) fail(token, 'La invitación no existe.')
  if (before.status === InvitationStatus.REVOKED) fail(token, 'La invitación ha sido revocada.')
  if (before.status === InvitationStatus.PENDING && before.expiresAt <= new Date()) {
    fail(token, 'La invitación ha caducado.')
  }

  const supabase = await createServerClient()
  let { data: { user } } = await supabase.auth.getUser()

  if (!user && before.status === InvitationStatus.PENDING) {
    const tokenHash = typeof tokenHashValue === 'string' ? tokenHashValue : ''
    const typeResult = otpTypeSchema.safeParse(otpTypeValue)
    if (!tokenHash || !typeResult.success) fail(token, 'Falta la verificación segura del correo.')

    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: typeResult.data })
    if (error) fail(token, 'El enlace de autenticación ha caducado o ya fue utilizado.')
    const result = await supabase.auth.getUser()
    user = result.data.user
  }

  if (!user?.email) fail(token, 'No se pudo verificar la identidad del invitado.')
  if (normalizeEmail(user.email) !== normalizeEmail(before.email)) {
    fail(token, 'La cuenta autenticada no coincide con el correo invitado.')
  }

  const verifiedUser = { id: user.id, email: user.email, user_metadata: user.user_metadata }
  let membership: AcceptedMembership | null

  try {
    membership = await getAcceptedMembership(token, verifiedUser)
    for (let attempt = 1; !membership && attempt <= MAX_ACCEPTANCE_ATTEMPTS; attempt += 1) {
      try {
        membership = await createMembershipFromInvitation(token, verifiedUser)
      } catch (error) {
        const retryable = isSerializationConflict(error)
        const racedWithAcceptance = error instanceof Error && error.message === 'INVITATION_NOT_PENDING'
        if (retryable || racedWithAcceptance) {
          membership = await getAcceptedMembership(token, verifiedUser)
          if (membership) break
          if (retryable && attempt < MAX_ACCEPTANCE_ATTEMPTS) continue
        }
        throw error
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'FOREIGN_TENANT') {
      fail(token, 'Esta cuenta ya pertenece a otra empresa.')
    }
    if (error instanceof Error && error.message === 'INVITATION_EXPIRED') {
      fail(token, 'La invitación ha caducado.')
    }
    if (error instanceof Error && error.message === 'ACCEPTED_BY_OTHER') {
      fail(token, 'Esta invitación ya fue aceptada por otra cuenta.')
    }
    if (error instanceof Error && error.message === 'EMAIL_MISMATCH') {
      fail(token, 'La cuenta autenticada no coincide con el correo invitado.')
    }
    if (error instanceof Error && error.message === 'MEMBERSHIP_MISSING') {
      fail(token, 'El membership aceptado no está disponible.')
    }
    if (error instanceof Error && error.message === 'INVITATION_NOT_PENDING') {
      fail(token, 'La invitación ya no está pendiente.')
    }
    throw error
  }

  if (!membership) throw new Error('Invitation acceptance did not produce a membership')

  try {
    await persistInvitationSession(user.id, membership.tenantId, membership.role)
  } catch (error) {
    console.error('Invitation accepted but session metadata refresh failed', error instanceof Error ? error.message : 'unknown error')
    fail(token, 'La invitación fue aceptada, pero no se pudo iniciar la sesión. Pulsa aceptar de nuevo.')
  }

  redirect('/dashboard')
}
