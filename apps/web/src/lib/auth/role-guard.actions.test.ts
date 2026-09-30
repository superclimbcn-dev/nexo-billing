import { vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { describe, expect, it } from 'vitest'
import { canAccessSettings, canExport, canManageTeam, canRead, canWrite, isAccountant } from './role-guard'

const user = (role: string) => ({ app_metadata: { tenant_id: 'tenant-a', role } })

describe('canonical role matrix', () => {
  it.each(['OWNER', 'ADMIN'])('%s can administer and write', (role) => {
    expect(canWrite(user(role))).toBe(true)
    expect(canManageTeam(user(role))).toBe(true)
    expect(canAccessSettings(user(role))).toBe(true)
  })

  it('ACCOUNTANT is recognized without administrative privileges', () => {
    expect(isAccountant(user('ACCOUNTANT'))).toBe(true)
    expect(canRead(user('ACCOUNTANT'))).toBe(true)
    expect(canWrite(user('ACCOUNTANT'))).toBe(false)
    expect(canManageTeam(user('ACCOUNTANT'))).toBe(false)
    expect(canExport(user('ACCOUNTANT'))).toBe(true)
  })

  it('MEMBER can read but cannot administer', () => {
    expect(canRead(user('MEMBER'))).toBe(true)
    expect(canWrite(user('MEMBER'))).toBe(false)
    expect(canExport(user('MEMBER'))).toBe(false)
  })

  it('VIEWER has no write or administration privileges', () => {
    expect(canRead(user('VIEWER'))).toBe(true)
    expect(canWrite(user('VIEWER'))).toBe(false)
    expect(canManageTeam(user('VIEWER'))).toBe(false)
    expect(canExport(user('VIEWER'))).toBe(false)
  })
})
