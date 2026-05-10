import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createProvider } from './factory'
import { MockProvider } from './mock'
import { MockProviderV2 } from './mock-v2'

describe('createProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.VERIFACTU_PROVIDER
    delete process.env.VERIFACTU_MOCK_MODE
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns MockProvider when provider is "mock"', () => {
    const provider = createProvider({ provider: 'mock' })
    expect(provider).toBeInstanceOf(MockProvider)
    expect(provider.name).toBe('mock')
  })

  it('returns MockProviderV2 when provider is "mock-v2"', () => {
    const provider = createProvider({ provider: 'mock-v2' })
    expect(provider).toBeInstanceOf(MockProviderV2)
    expect(provider.name).toBe('mock-v2')
  })

  it('uses happy mode for mock-v2 when specified', () => {
    const provider = createProvider({ provider: 'mock-v2', mockMode: 'happy' })
    expect(provider).toBeInstanceOf(MockProviderV2)
  })

  it('uses realistic mode for mock-v2 by default', () => {
    const provider = createProvider({ provider: 'mock-v2' })
    expect(provider).toBeInstanceOf(MockProviderV2)
  })

  it('reads VERIFACTU_PROVIDER from environment', () => {
    process.env.VERIFACTU_PROVIDER = 'mock'
    const provider = createProvider()
    expect(provider).toBeInstanceOf(MockProvider)
  })

  it('reads VERIFACTU_MOCK_MODE from environment', () => {
    process.env.VERIFACTU_PROVIDER = 'mock-v2'
    process.env.VERIFACTU_MOCK_MODE = 'happy'
    const provider = createProvider()
    expect(provider).toBeInstanceOf(MockProviderV2)
  })

  it('defaults to mock provider when no env or option set', () => {
    const provider = createProvider()
    expect(provider).toBeInstanceOf(MockProvider)
  })

  it('throws for unimplemented verifacti provider', () => {
    expect(() => createProvider({ provider: 'verifacti' })).toThrow(
      'Verifacti provider is not yet implemented',
    )
  })

  it('throws for unknown provider name', () => {
    expect(() => createProvider({ provider: 'unknown' as never })).toThrow(
      'Unknown Verifactu provider',
    )
  })

  it('options override environment variables', () => {
    process.env.VERIFACTU_PROVIDER = 'mock'
    const provider = createProvider({ provider: 'mock-v2', mockMode: 'happy' })
    expect(provider).toBeInstanceOf(MockProviderV2)
  })
})
