import { UserRole } from '@nexo/prisma'
import { createServerClient } from '@nexo/core-auth'

export interface AuthUser {
  app_metadata?: {
    tenant_id?: string
    role?: string
  }
}

export async function requireAuth() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const tenantId = user.app_metadata?.tenant_id as string | undefined
  const role = user.app_metadata?.role as string | undefined
  if (!tenantId) return null
  return { user, tenantId, role }
}

export async function requireOwnerOrAdminAction() {
  const ctx = await requireAuth()
  if (!ctx) return null
  if (ctx.role !== UserRole.OWNER && ctx.role !== UserRole.ADMIN) return null
  return ctx
}

export function getRole(user: AuthUser | null): string | null {
  return user?.app_metadata?.role ?? null
}

export function getTenantId(user: AuthUser | null): string | null {
  return user?.app_metadata?.tenant_id ?? null
}

export function isOwnerOrAdmin(user: AuthUser | null): boolean {
  const role = getRole(user)
  return role === UserRole.OWNER || role === UserRole.ADMIN
}

export function isAccountant(user: AuthUser | null): boolean {
  return getRole(user) === UserRole.ACCOUNTANT
}

export function isMember(user: AuthUser | null): boolean {
  return getRole(user) === UserRole.MEMBER
}

export function canRead(user: AuthUser | null): boolean {
  const role = getRole(user)
  return (
    role === UserRole.OWNER ||
    role === UserRole.ADMIN ||
    role === UserRole.ACCOUNTANT ||
    role === UserRole.MEMBER
  )
}

export function canWrite(user: AuthUser | null): boolean {
  return isOwnerOrAdmin(user)
}

export function canExport(user: AuthUser | null): boolean {
  return isOwnerOrAdmin(user)
}

export function canManageTeam(user: AuthUser | null): boolean {
  return isOwnerOrAdmin(user)
}

export function canAccessSettings(user: AuthUser | null): boolean {
  return isOwnerOrAdmin(user)
}
