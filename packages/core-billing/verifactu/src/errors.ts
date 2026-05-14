/**
 * Typed errors for the Verifactu module.
 *
 * Never throw generic `Error` — always use one of these subclasses.
 */

export class VerifactuError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VerifactuError'
  }
}

export class VerifactuValidationError extends VerifactuError {
  constructor(message: string, public readonly fields: string[]) {
    super(message)
    this.name = 'VerifactuValidationError'
  }
}

export class VerifactuChainBrokenError extends VerifactuError {
  constructor(
    message: string,
    public readonly tenantId: string,
    public readonly expectedHash: string,
    public readonly actualHash: string,
  ) {
    super(message)
    this.name = 'VerifactuChainBrokenError'
  }
}

export class VerifactuProviderError extends VerifactuError {
  constructor(message: string, public readonly providerName: string) {
    super(message)
    this.name = 'VerifactuProviderError'
  }
}

export class VerifactuAEATRejectionError extends VerifactuError {
  constructor(
    message: string,
    public readonly aeatCode: string,
    public readonly aeatMessage: string,
  ) {
    super(message)
    this.name = 'VerifactuAEATRejectionError'
  }
}

export class VerifactuTimeoutError extends VerifactuError {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message)
    this.name = 'VerifactuTimeoutError'
  }
}
