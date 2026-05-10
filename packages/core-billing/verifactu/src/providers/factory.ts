import type { IVerifactuProvider } from './interface'
import { MockProvider } from './mock'
import { MockProviderV2 } from './mock-v2'

export type ProviderName = 'mock' | 'mock-v2' | 'verifacti'

export interface FactoryOptions {
  /** Override provider selection (defaults to env var VERIFACTU_PROVIDER) */
  provider?: ProviderName
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
 */
export function createProvider(options: FactoryOptions = {}): IVerifactuProvider {
  const providerName = (options.provider ?? getEnvVar('VERIFACTU_PROVIDER') ?? 'mock') as ProviderName
  const mockMode = options.mockMode ?? (getEnvVar('VERIFACTU_MOCK_MODE') as 'happy' | 'realistic') ?? 'realistic'

  switch (providerName) {
    case 'mock':
      return new MockProvider()
    case 'mock-v2':
      return new MockProviderV2(mockMode)
    case 'verifacti':
      // TODO: implement real Verifacti provider when API credentials are available
      throw new Error(
        'Verifacti provider is not yet implemented. ' +
          'Set VERIFACTU_PROVIDER=mock or mock-v2 for development.',
      )
    default:
      throw new Error(
        `Unknown Verifactu provider "${providerName}". ` +
          `Expected one of: mock, mock-v2, verifacti.`,
      )
  }
}
