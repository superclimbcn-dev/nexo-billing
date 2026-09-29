'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, createAdminClient } from '@nexo/core-auth'
import { InvitationStatus, prisma, UserRole } from '@nexo/prisma'
import { z } from 'zod'
import { getCanonicalAppUrl } from '@/lib/auth/app-url'

const INVITABLE_ROLES = [
  UserRole.ADMIN,
  UserRole.MEMBER,
  UserRole.VIEWER,
  UserRole.ACCOUNTANT,
] as const

const invitationInputSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  role: z.enum(INVITABLE_ROLES),
})

async function requireOwnerOrAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id as string | undefined
  const role = user.app_metadata?.role as string | undefined
  if (!tenantId) redirect('/onboarding/cuenta')
  if (role !== UserRole.OWNER && role !== UserRole.ADMIN) redirect('/dashboard')

  return { user, tenantId }
}

async function authUserExists(email: string): Promise<boolean> {
  const adminClient = createAdminClient()
  const perPage = 200

  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    if (data.users.some((user) => user.email?.toLowerCase() === email)) return true
    if (data.users.length < perPage) return false
  }

  throw new Error('No se pudo verificar el usuario de autenticación')
}

async function sendInvitationEmail(email: string, acceptanceUrl: string): Promise<void> {
  if (await authUserExists(email)) {
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { error } = await authClient.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: acceptanceUrl },
    })
    if (error) throw error
    return
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: acceptanceUrl,
  })
  if (error) throw error
}

export async function inviteUser(formData: FormData) {
  const { user, tenantId } = await requireOwnerOrAdmin()
  const parsed = invitationInputSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
  })
  if (!parsed.success) redirect('/settings/team?error=Correo+o+rol+no+válido')

  const { email, role } = parsed.data
  const existingMember = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { tenantId: true },
  })
  if (existingMember?.tenantId === tenantId) {
    redirect('/settings/team?error=Ese+usuario+ya+pertenece+a+tu+equipo')
  }
  if (existingMember) {
    redirect('/settings/team?error=Ese+correo+ya+pertenece+a+otra+empresa')
  }

  await prisma.invitation.updateMany({
    where: { tenantId, email: { equals: email, mode: 'insensitive' }, status: InvitationStatus.PENDING, expiresAt: { lte: new Date() } },
    data: { status: InvitationStatus.REVOKED, revokedAt: new Date() },
  })

  const existing = await prisma.invitation.findFirst({
    where: { tenantId, email: { equals: email, mode: 'insensitive' }, status: InvitationStatus.PENDING },
    select: { id: true },
  })
  if (existing) redirect('/settings/team?error=Ya+existe+una+invitación+para+ese+correo')

  // The initial expiry makes the row unusable until email delivery succeeds.
  const invitation = await prisma.invitation.create({
    data: { tenantId, email, role, invitedBy: user.id, expiresAt: new Date(0) },
  })

  try {
    const acceptanceUrl = `${getCanonicalAppUrl()}/invite/${invitation.token}`
    await sendInvitationEmail(email, acceptanceUrl)
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    })
  } catch (error) {
    await prisma.invitation.updateMany({
      where: { id: invitation.id, tenantId, status: InvitationStatus.PENDING },
      data: { status: InvitationStatus.REVOKED, revokedAt: new Date() },
    })
    console.error('Invitation delivery failed', error instanceof Error ? error.message : 'unknown error')
    redirect('/settings/team?error=No+se+pudo+enviar+la+invitación')
  }

  revalidatePath('/settings/team')
  redirect('/settings/team?success=Invitación+enviada')
}

export async function revokeInvitation(formData: FormData) {
  const { tenantId } = await requireOwnerOrAdmin()
  const invitationId = formData.get('invitationId')
  if (typeof invitationId !== 'string' || !invitationId) return

  await prisma.invitation.updateMany({
    where: { id: invitationId, tenantId, status: InvitationStatus.PENDING },
    data: { status: InvitationStatus.REVOKED, revokedAt: new Date() },
  })
  revalidatePath('/settings/team')
}

export async function removeTeamMember(formData: FormData) {
  const { user, tenantId } = await requireOwnerOrAdmin()
  const userId = formData.get('userId')
  if (typeof userId !== 'string' || !userId || userId === user.id) {
    redirect('/settings/team?error=No+puedes+eliminarte+a+ti+mismo')
  }

  await prisma.user.deleteMany({ where: { id: userId, tenantId, role: { not: UserRole.OWNER } } })
  revalidatePath('/settings/team')
}
