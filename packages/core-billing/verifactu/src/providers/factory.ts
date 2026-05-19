import type { IVerifactuProvider } from './interface'
import { MockProvider } from './mock'
import { MockProviderV2 } from './mock-v2'
import { VerifactiProvider } from './verifacti'

export type ProviderName = 'mock' | 'mock-v2' | 'verifacti'

export interface FactoryOptions {
  /** Override provider selection (defaults to env var VERIFACTU_PROVIDER) */
  provider?: ProviderName
  /** Per-tenant provider override — takes priority over provider and env var */
  tenantProvider?: ProviderName
  /** Override mock mode (defaults to env var VERIFACTU_MOCK_MODE) */
  mockMode?: 'happy' | 'realistic'
}

function getEnvVar(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name]
  }
  return undefined
}

/**
 * Create a Verifactu provider instance based on environment or explicit options.
 *
 * Environment variables:
 *   VERIFACTU_PROVIDER   — 'mock' | 'mock-v2' | 'verifacti'  (default: 'mock')
 *   VERIFACTU_MOCK_MODE  — 'happy' | 'realistic'             (default: 'realistic')
 *   VERIFACTU_API_KEY    — API key for Verifacti (required when provider=verifacti)
 *   VERIFACTU_API_URL    — Base URL override (default: https://app.verifactuapi.es)
 */
export function createProvider(options: FactoryOptions = {}): IVerifactuProvider {
  const providerName = (options.tenantProvider ?? options.provider ?? getEnvVar('VERIFACTU_PROVIDER') ?? 'mock') as ProviderName
  const mockMode = options.mockMode ?? (getEnvVar('VERIFACTU_MOCK_MODE') as 'happy' | 'realistic') ?? 'realistic'

  switch (providerName) {
    case 'mock':
      return new MockProvider()
    case 'mock-v2':
      return new MockProviderV2(mockMode)
    case 'verifacti': {
      const apiKey = getEnvVar('VERIFACTU_API_KEY')
      if (!apiKey) {
        throw new Error(
          'VERIFACTU_API_KEY is required when VERIFACTU_PROVIDER=verifacti. ' +
            'Add it to your .env.local or Vercel environment variables.',
        )
      }
      const baseUrl = getEnvVar('VERIFACTU_API_URL')
      const isProduction = getEnvVar('NODE_ENV') === 'production'
      return new VerifactiProvider(apiKey, { baseUrl, isProduction })
    }
    default:
      throw new Error(
        `Unknown Verifactu provider "${providerName}". ` +
          `Expected one of: mock, mock-v2, verifacti.`,
      )
  }
}
