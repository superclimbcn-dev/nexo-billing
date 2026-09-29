import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCanonicalAppUrl } from './app-url'

afterEach(() => { vi.unstubAllEnvs() })

describe('canonical authentication URL', () => {
  it('uses the explicit production URL and strips paths', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://billing.nexo-digital.app/path')
    expect(getCanonicalAppUrl()).toBe('https://billing.nexo-digital.app')
  })

  it('rejects insecure non-local URLs', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://billing.nexo-digital.app')
    expect(() => getCanonicalAppUrl()).toThrow('HTTPS')
  })

    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
  it('allows localhost during development', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '')
    vi.stubEnv('NODE_ENV', 'test')
    expect(getCanonicalAppUrl()).toBe('http://localhost:3000')
  })

    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
  it('fails closed when production has no canonical URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '')
    vi.stubEnv('NODE_ENV', 'production')
    expect(() => getCanonicalAppUrl()).toThrow('must be configured')
  })
})
