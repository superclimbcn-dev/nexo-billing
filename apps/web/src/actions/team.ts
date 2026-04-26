'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServerClient, createAdminClient } from '@nexo/core-auth'
import { prisma, UserRole } from '@nexo/prisma'

async function getOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

async function requireOwnerOrAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tenantId = user.app_metadata?.tenant_id as string | undefined
  const role = user.app_metadata?.role as string | undefined

  if (!tenantId) redirect('/onboarding/cuenta')
  if (role !== UserRole.OWNER && role !== UserRole.ADMIN) {
    redirect('/dashboard')
  }

  return { user, tenantId }
}

export async function inviteUser(formData: FormData) {
  const { tenantId } = await requireOwnerOrAdmin()

  const email = (formData.get('email') as string | null)?.trim()
  const role = (formData.get('role') as UserRole | null) ?? UserRole.MEMBER

  if (!email) {
    redirect('/settings/team?error=El+correo+es+requerido')
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const existing = await prisma.invitation.findUnique({
    where: { tenantId_email: { tenantId, email } },
  })
  if (existing) {
    redirect('/settings/team?error=Ya+existe+una+invitaci%C3%B3n+para+ese+correo')
  }

  const isMember = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId, email } },
  })
  if (isMember) {
    redirect('/settings/team?error=Ese+usuario+ya+pertenece+a+tu+equipo')
  }

  const invitation = await prisma.invitation.create({
    data: { tenantId, email, role, expiresAt },
  })

  const origin = await getOrigin()
  const adminClient = createAdminClient()

  await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback?invite_token=${invitation.token}`,
    data: { invited_to_tenant: tenantId },
  })

  revalidatePath('/settings/team')
}

export async function revokeInvitation(formData: FormData) {
  const { tenantId } = await requireOwnerOrAdmin()

  const invitationId = formData.get('invitationId') as string
  if (!invitationId) return

  await prisma.invitation.deleteMany({
    where: { id: invitationId, tenantId },
  })

  revalidatePath('/settings/team')
}

export async function removeTeamMember(formData: FormData) {
  const { user, tenantId } = await requireOwnerOrAdmin()

  const userId = formData.get('userId') as string
  if (!userId || userId === user.id) {
    redirect('/settings/team?error=No+puedes+eliminarte+a+ti+mismo')
  }

  await prisma.user.deleteMany({
    where: { id: userId, tenantId, role: { not: UserRole.OWNER } },
  })

  revalidatePath('/settings/team')
}
