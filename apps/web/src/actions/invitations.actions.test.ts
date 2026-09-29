import { beforeEach, describe, expect, it, vi } from 'vitest'

class RedirectError extends Error {
  constructor(readonly url: string) { super(`REDIRECT:${url}`) }
}

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  verifyOtp: vi.fn(),
  refreshSession: vi.fn(),
  adminGetUser: vi.fn(),
  adminUpdateUser: vi.fn(),
  invitationFind: vi.fn(),
  transaction: vi.fn(),
  lock: vi.fn(),
  txInvitationFind: vi.fn(),
  txInvitationUpdate: vi.fn(),
  userFindUnique: vi.fn(),
  userFindFirst: vi.fn(),
  userCreate: vi.fn(),
  auditCreate: vi.fn(),
}))

vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new RedirectError(url) } }))
vi.mock('server-only', () => ({}))
vi.mock('@nexo/core-auth', () => ({
  createServerClient: async () => ({ auth: {
    getUser: mocks.getUser,
    verifyOtp: mocks.verifyOtp,
    refreshSession: mocks.refreshSession,
  } }),
  createAdminClient: () => ({ auth: { admin: {
    getUserById: mocks.adminGetUser,
    updateUserById: mocks.adminUpdateUser,
  } } }),
}))
vi.mock('@nexo/prisma', async (importOriginal) => {
  const original = await importOriginal<typeof import('@nexo/prisma')>()
  return { ...original, prisma: {
    invitation: { findUnique: mocks.invitationFind },
    user: { findFirst: mocks.userFindFirst },
    $transaction: mocks.transaction,
  } }
})

import { Prisma } from '@nexo/prisma'
import { acceptInvitation, getInvitationView } from './invitations'

const token = '11111111-1111-4111-8111-111111111111'
const now = new Date('2026-09-29T12:00:00.000Z')
const invitation = (overrides: Record<string, unknown> = {}) => ({
  id: 'invite-a', token, tenantId: 'tenant-a', email: 'accountant@example.com',
  role: 'ACCOUNTANT', status: 'PENDING', expiresAt: new Date('2099-01-01T00:00:00Z'),
  acceptedBy: null, tenant: { name: 'Empresa A' }, ...overrides,
})
const authUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-a', email: 'accountant@example.com', app_metadata: {}, user_metadata: {}, ...overrides,
})
const form = (extra: Record<string, string> = {}) => {
  const data = new FormData()
  data.set('invitationToken', token)
  data.set('tokenHash', 'otp-hash')
  data.set('otpType', 'invite')
  for (const [key, value] of Object.entries(extra)) data.set(key, value)
  return data
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.setSystemTime(now)
  mocks.invitationFind.mockResolvedValue(invitation())
  mocks.getUser.mockResolvedValue({ data: { user: null } })
  mocks.verifyOtp.mockResolvedValue({ error: null })
  mocks.getUser.mockResolvedValueOnce({ data: { user: null } }).mockResolvedValue({ data: { user: authUser() } })
  mocks.txInvitationFind.mockResolvedValue(invitation())
  mocks.userFindUnique.mockResolvedValue(null)
  mocks.userFindFirst.mockResolvedValue(null)
  mocks.userCreate.mockResolvedValue({ id: 'user-a', tenantId: 'tenant-a', role: 'ACCOUNTANT' })
  mocks.adminGetUser.mockResolvedValue({ data: { user: authUser() }, error: null })
  mocks.adminUpdateUser.mockResolvedValue({ error: null })
  mocks.refreshSession.mockResolvedValue({ error: null })
  mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
    $queryRaw: mocks.lock,
    invitation: { findUnique: mocks.txInvitationFind, update: mocks.txInvitationUpdate },
    user: { findUnique: mocks.userFindUnique, findFirst: mocks.userFindFirst, create: mocks.userCreate },
    auditLog: { create: mocks.auditCreate },
  }))
})

describe('invitation read page', () => {
  it('reads a pending invitation without consuming auth or writing state', async () => {
    const result = await getInvitationView(token)
    expect(result).toMatchObject({ email: 'accountant@example.com', role: 'ACCOUNTANT', tenantName: 'Empresa A' })
    expect(mocks.verifyOtp).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.txInvitationUpdate).not.toHaveBeenCalled()
  })

  it('allows repeated prefetch GETs without consuming anything', async () => {
    await getInvitationView(token)
    await getInvitationView(token)
    expect(mocks.invitationFind).toHaveBeenCalledTimes(2)
    expect(mocks.verifyOtp).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('does not query the database for a malformed token', async () => {
    expect(await getInvitationView('not-a-token')).toBeNull()
    expect(mocks.invitationFind).not.toHaveBeenCalled()
  })
})

describe('invitation acceptance', () => {
  it.each(['ADMIN', 'MEMBER', 'VIEWER', 'ACCOUNTANT'])('preserves the persisted %s role', async (role) => {
    mocks.invitationFind.mockResolvedValue(invitation({ role }))
    mocks.txInvitationFind.mockResolvedValue(invitation({ role }))
    mocks.userCreate.mockResolvedValue({ id: 'user-a', tenantId: 'tenant-a', role })
    await expect(acceptInvitation(form({ role: 'OWNER', tenantId: 'tenant-b', email: 'attacker@example.com' }))).rejects.toMatchObject({ url: '/dashboard' })
    expect(mocks.userCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ tenantId: 'tenant-a', email: 'accountant@example.com', role }) })
    expect(mocks.adminUpdateUser).toHaveBeenCalledWith('user-a', expect.objectContaining({ app_metadata: expect.objectContaining({ tenant_id: 'tenant-a', role }) }))
  })

  it('never promotes an accountant to owner through manipulated form fields', async () => {
    await expect(acceptInvitation(form({ role: 'OWNER' }))).rejects.toMatchObject({ url: '/dashboard' })
    expect(mocks.userCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ role: 'ACCOUNTANT' }) })
  })

  it('rejects a mismatching authenticated email', async () => {
    mocks.getUser.mockReset().mockResolvedValue({ data: { user: authUser({ email: 'other@example.com' }) } })
    await expect(acceptInvitation(form())).rejects.toMatchObject({ url: expect.stringContaining('no%20coincide') })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('rejects an expired invitation before consuming the OTP', async () => {
    mocks.invitationFind.mockResolvedValue(invitation({ expiresAt: new Date('2020-01-01') }))
    await expect(acceptInvitation(form())).rejects.toMatchObject({ url: expect.stringContaining('caducado') })
    expect(mocks.verifyOtp).not.toHaveBeenCalled()
  })

  it('rejects a revoked invitation before consuming the OTP', async () => {
    mocks.invitationFind.mockResolvedValue(invitation({ status: 'REVOKED' }))
    await expect(acceptInvitation(form())).rejects.toMatchObject({ url: expect.stringContaining('revocada') })
    expect(mocks.verifyOtp).not.toHaveBeenCalled()
  })

  it('rejects missing auth parameters without changing membership', async () => {
    await expect(acceptInvitation(form({ tokenHash: '', otpType: '' }))).rejects.toMatchObject({ url: expect.stringContaining('verificaci%C3%B3n') })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('rejects an invalid or consumed token hash', async () => {
    mocks.verifyOtp.mockResolvedValue({ error: new Error('expired') })
    await expect(acceptInvitation(form())).rejects.toMatchObject({ url: expect.stringContaining('utilizado') })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('rejects a user already assigned to another tenant', async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 'user-a', tenantId: 'tenant-b' })
    await expect(acceptInvitation(form())).rejects.toMatchObject({ url: expect.stringContaining('otra%20empresa') })
    expect(mocks.txInvitationUpdate).not.toHaveBeenCalled()
    expect(mocks.adminUpdateUser).not.toHaveBeenCalled()
  })

  it('updates membership and invitation atomically after acquiring a row lock', async () => {
    await expect(acceptInvitation(form())).rejects.toMatchObject({ url: '/dashboard' })
    expect(mocks.lock).toHaveBeenCalledTimes(1)
    expect(mocks.txInvitationUpdate).toHaveBeenCalledWith({ where: { id: 'invite-a' }, data: expect.objectContaining({ status: 'ACCEPTED', acceptedBy: 'user-a' }) })
    expect(mocks.auditCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ tenantId: 'tenant-a', action: 'USER_JOINED' }) })
  })

  it('does not mark the invitation accepted if membership creation fails', async () => {
    mocks.userCreate.mockRejectedValue(new Error('database failure'))
    await expect(acceptInvitation(form())).rejects.toThrow('database failure')
    expect(mocks.txInvitationUpdate).not.toHaveBeenCalled()
    expect(mocks.adminUpdateUser).not.toHaveBeenCalled()
  })

  it('is idempotent for the same accepted user and repairs session metadata', async () => {
    mocks.invitationFind.mockResolvedValue(invitation({ status: 'ACCEPTED', acceptedBy: 'user-a' }))
    mocks.getUser.mockReset().mockResolvedValue({ data: { user: authUser() } })
    mocks.userFindFirst.mockResolvedValue({ id: 'user-a', tenantId: 'tenant-a', email: 'accountant@example.com', role: 'ACCOUNTANT' })
    await expect(acceptInvitation(form())).rejects.toMatchObject({ url: '/dashboard' })
    expect(mocks.verifyOtp).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.adminUpdateUser).toHaveBeenCalled()
  })

  it('does not reuse an accepted invitation for another user', async () => {
    mocks.invitationFind.mockResolvedValue(invitation({ status: 'ACCEPTED', acceptedBy: 'user-b' }))
    mocks.getUser.mockReset().mockResolvedValue({ data: { user: authUser() } })
    await expect(acceptInvitation(form())).rejects.toMatchObject({ url: expect.stringContaining('otra%20cuenta') })
    expect(mocks.adminUpdateUser).not.toHaveBeenCalled()
  })

  it('treats P2034 as success when the same user already accepted concurrently', async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError('write conflict', {
      code: 'P2034',
      clientVersion: '5.22.0',
    })
    mocks.invitationFind
      .mockResolvedValueOnce(invitation())
      .mockResolvedValueOnce(invitation())
      .mockResolvedValue(invitation({ status: 'ACCEPTED', acceptedBy: 'user-a' }))
    mocks.transaction.mockRejectedValueOnce(conflict)
    mocks.userFindFirst.mockResolvedValue({
      id: 'user-a',
      tenantId: 'tenant-a',
      email: 'accountant@example.com',
      role: 'ACCOUNTANT',
    })

    await expect(acceptInvitation(form())).rejects.toMatchObject({ url: '/dashboard' })
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
    expect(mocks.userCreate).not.toHaveBeenCalled()
    expect(mocks.auditCreate).not.toHaveBeenCalled()
    expect(mocks.adminUpdateUser).toHaveBeenCalledWith(
      'user-a',
      expect.objectContaining({ app_metadata: expect.objectContaining({ role: 'ACCOUNTANT' }) }),
    )
  })

  it('retries P2034 at most three times and then succeeds', async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError('write conflict', {
      code: 'P2034',
      clientVersion: '5.22.0',
    })
    mocks.transaction.mockRejectedValueOnce(conflict).mockRejectedValueOnce(conflict)

    await expect(acceptInvitation(form())).rejects.toMatchObject({ url: '/dashboard' })
    expect(mocks.transaction).toHaveBeenCalledTimes(3)
    expect(mocks.userCreate).toHaveBeenCalledTimes(1)
    expect(mocks.auditCreate).toHaveBeenCalledTimes(1)
  })

  it('does not retry non-P2034 failures', async () => {
    mocks.transaction.mockRejectedValueOnce(new Error('database unavailable'))
    await expect(acceptInvitation(form())).rejects.toThrow('database unavailable')
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
  })

  it('rejects a concurrent acceptance by another identity', async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError('write conflict', {
      code: 'P2034',
      clientVersion: '5.22.0',
    })
    mocks.invitationFind
      .mockResolvedValueOnce(invitation())
      .mockResolvedValueOnce(invitation())
      .mockResolvedValue(invitation({ status: 'ACCEPTED', acceptedBy: 'user-b' }))
    mocks.transaction.mockRejectedValueOnce(conflict)

    await expect(acceptInvitation(form())).rejects.toMatchObject({
      url: expect.stringContaining('otra%20cuenta'),
    })
    expect(mocks.adminUpdateUser).not.toHaveBeenCalled()
  })

  it('returns idempotent success for two simultaneous acceptance POSTs', async () => {
    mocks.getUser.mockReset().mockResolvedValue({ data: { user: authUser() } })
    let lookupCount = 0
    mocks.invitationFind.mockImplementation(async () => {
      lookupCount += 1
      return lookupCount <= 4
        ? invitation()
        : invitation({ status: 'ACCEPTED', acceptedBy: 'user-a' })
    })
    mocks.userFindFirst.mockResolvedValue({
      id: 'user-a', tenantId: 'tenant-a', email: 'accountant@example.com', role: 'ACCOUNTANT',
    })
    const conflict = new Prisma.PrismaClientKnownRequestError('write conflict', {
      code: 'P2034', clientVersion: '5.22.0',
    })
    let releaseWinner: (() => void) | undefined
    const winnerDone = new Promise<void>((resolve) => { releaseWinner = resolve })
    let transactionCount = 0
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      transactionCount += 1
      if (transactionCount > 1) {
        await winnerDone
        throw conflict
      }
      const result = await callback({
        $queryRaw: mocks.lock,
        invitation: { findUnique: mocks.txInvitationFind, update: mocks.txInvitationUpdate },
        user: { findUnique: mocks.userFindUnique, findFirst: mocks.userFindFirst, create: mocks.userCreate },
        auditLog: { create: mocks.auditCreate },
      })
      releaseWinner?.()
      return result
    })

    const results = await Promise.allSettled([acceptInvitation(form()), acceptInvitation(form())])

    expect(results).toHaveLength(2)
    for (const result of results) {
      expect(result.status).toBe('rejected')
      if (result.status === 'rejected') expect(result.reason).toMatchObject({ url: '/dashboard' })
    }
    expect(mocks.transaction).toHaveBeenCalledTimes(2)
    expect(mocks.userCreate).toHaveBeenCalledTimes(1)
    expect(mocks.txInvitationUpdate).toHaveBeenCalledTimes(1)
    expect(mocks.auditCreate).toHaveBeenCalledTimes(1)
    expect(mocks.adminUpdateUser).toHaveBeenCalledTimes(2)
  })

  it('returns idempotent success for four simultaneous acceptance POSTs', async () => {
    const requestCount = 4
    mocks.getUser.mockReset().mockResolvedValue({ data: { user: authUser() } })
    let lookupCount = 0
    mocks.invitationFind.mockImplementation(async () => {
      lookupCount += 1
      return lookupCount <= requestCount * 2
        ? invitation()
        : invitation({ status: 'ACCEPTED', acceptedBy: 'user-a' })
    })
    mocks.userFindFirst.mockResolvedValue({
      id: 'user-a', tenantId: 'tenant-a', email: 'accountant@example.com', role: 'ACCOUNTANT',
    })
    const conflict = new Prisma.PrismaClientKnownRequestError('write conflict', {
      code: 'P2034', clientVersion: '5.22.0',
    })
    let releaseWinner: (() => void) | undefined
    const winnerDone = new Promise<void>((resolve) => { releaseWinner = resolve })
    let transactionCount = 0
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      transactionCount += 1
      if (transactionCount > 1) {
        await winnerDone
        throw conflict
      }
      const result = await callback({
        $queryRaw: mocks.lock,
        invitation: { findUnique: mocks.txInvitationFind, update: mocks.txInvitationUpdate },
        user: { findUnique: mocks.userFindUnique, findFirst: mocks.userFindFirst, create: mocks.userCreate },
        auditLog: { create: mocks.auditCreate },
      })
      releaseWinner?.()
      return result
    })

    const results = await Promise.allSettled(
      Array.from({ length: requestCount }, () => acceptInvitation(form())),
    )

    expect(results).toHaveLength(requestCount)
    for (const result of results) {
      expect(result.status).toBe('rejected')
      if (result.status === 'rejected') expect(result.reason).toMatchObject({ url: '/dashboard' })
    }
    expect(mocks.transaction).toHaveBeenCalledTimes(requestCount)
    expect(mocks.userCreate).toHaveBeenCalledTimes(1)
    expect(mocks.txInvitationUpdate).toHaveBeenCalledTimes(1)
    expect(mocks.auditCreate).toHaveBeenCalledTimes(1)
    expect(mocks.adminUpdateUser).toHaveBeenCalledTimes(requestCount)
  })
})
