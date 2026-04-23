export type SessionUser = {
  id: string
  email: string
  tenantId: string
  role: string
}

export type TenantContext = {
  tenantId: string
  vertical: string
  plan: string
}
