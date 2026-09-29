import { beforeEach, describe, expect, it, vi } from 'vitest'

class RedirectError extends Error {
  constructor(readonly url: string) { super(`REDIRECT:${url}`) }
}

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  listUsers: vi.fn(),
  inviteUser: vi.fn(),
  signInWithOtp: vi.fn(),
  memberFind: vi.fn(),
  invitationUpdateMany: vi.fn(),
  invitationFind: vi.fn(),
  invitationCreate: vi.fn(),
  invitationUpdate: vi.fn(),
  revalidate: vi.fn(),
}))

vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new RedirectError(url) } }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: { signInWithOtp: mocks.signInWithOtp } }) }))
vi.mock('@nexo/core-auth', () => ({
  createServerClient: async () => ({ auth: { getUser: mocks.getUser } }),
  createAdminClient: () => ({ auth: { admin: { listUsers: mocks.listUsers, inviteUserByEmail: mocks.inviteUser } } }),
}))
vi.mock('@nexo/prisma', async (importOriginal) => {
  const original = await importOriginal<typeof import('@nexo/prisma')>()
  return { ...original, prisma: {
    user: { findFirst: mocks.memberFind, deleteMany: vi.fn() },
    invitation: {
      updateMany: mocks.invitationUpdateMany,
      findFirst: mocks.invitationFind,
      create: mocks.invitationCreate,
      update: mocks.invitationUpdate,
    },
  } }
})

import { inviteUser } from './team'

function form(email = 'accountant@example.com', role = 'ACCOUNTANT') {
  const data = new FormData()
  data.set('email', email)
  data.set('role', role)
  return data
}

beforeEach(() => {
  vi.resetAllMocks()
  process.env.NEXT_PUBLIC_SITE_URL = 'https://billing.nexo-digital.app'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'owner-a', app_metadata: { tenant_id: 'tenant-a', role: 'OWNER' } } } })
  mocks.memberFind.mockResolvedValue(null)
  mocks.invitationFind.mockResolvedValue(null)
  mocks.invitationCreate.mockResolvedValue({ id: 'invite-a', token: '11111111-1111-4111-8111-111111111111' })
  mocks.listUsers.mockResolvedValue({ data: { users: [] }, error: null })
  mocks.inviteUser.mockResolvedValue({ error: null })
  mocks.invitationUpdate.mockResolvedValue({})
  mocks.invitationUpdateMany.mockResolvedValue({ count: 0 })
})

describe('team invitation creation', () => {
  it('validates roles at runtime and rejects OWNER', async () => {
    await expect(inviteUser(form('owner@example.com', 'OWNER'))).rejects.toMatchObject({ url: expect.stringContaining('no+válido') })
    expect(mocks.invitationCreate).not.toHaveBeenCalled()
  })

  it('normalizes email and persists the selected accountant role', async () => {
    await expect(inviteUser(form('  Accountant@Example.com '))).rejects.toMatchObject({ url: expect.stringContaining('success=') })
    expect(mocks.invitationCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ tenantId: 'tenant-a', email: 'accountant@example.com', role: 'ACCOUNTANT', invitedBy: 'owner-a', expiresAt: new Date(0) }) })
    expect(mocks.inviteUser).toHaveBeenCalledWith('accountant@example.com', { redirectTo: 'https://billing.nexo-digital.app/invite/11111111-1111-4111-8111-111111111111' })
  })

  it('uses magic-link auth for an existing Supabase user', async () => {
    mocks.listUsers.mockResolvedValue({ data: { users: [{ email: 'accountant@example.com' }] }, error: null })
    mocks.signInWithOtp.mockResolvedValue({ error: null })
    await expect(inviteUser(form())).rejects.toMatchObject({ url: expect.stringContaining('success=') })
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({ email: 'accountant@example.com', options: { shouldCreateUser: false, emailRedirectTo: expect.stringContaining('/invite/') } })
    expect(mocks.inviteUser).not.toHaveBeenCalled()
  })

  it('revokes the unusable row when Supabase delivery fails', async () => {
    mocks.inviteUser.mockResolvedValue({ error: new Error('SMTP unavailable') })
    await expect(inviteUser(form())).rejects.toMatchObject({ url: expect.stringContaining('No+se+pudo') })
    expect(mocks.invitationUpdate).not.toHaveBeenCalled()
    expect(mocks.invitationUpdateMany).toHaveBeenLastCalledWith({
      where: { id: 'invite-a', tenantId: 'tenant-a', status: 'PENDING' },
      data: { status: 'REVOKED', revokedAt: expect.any(Date) },
    })
  })

  it('rejects an email already attached to another tenant', async () => {
    mocks.memberFind.mockResolvedValue({ tenantId: 'tenant-b' })
    await expect(inviteUser(form())).rejects.toMatchObject({ url: expect.stringContaining('otra+empresa') })
    expect(mocks.invitationCreate).not.toHaveBeenCalled()
    expect(mocks.inviteUser).not.toHaveBeenCalled()
  })
})
