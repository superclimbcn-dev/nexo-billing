import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VerifactiProvider } from './verifacti'
import { VerifactuProviderError, VerifactuTimeoutError, VerifactuAEATRejectionError } from '../errors'
import type { InvoiceData, InvoiceRecordData } from './types'

// ── Fixture helpers ──────────────────────────────────────────────────────────

const TEST_API_KEY = 'test-api-key-abc123'
const TEST_BASE_URL = 'https://app.verifactuapi.es'

function makeInvoice(overrides: Partial<InvoiceData> = {}): InvoiceData {
  return {
    id: 'inv-001',
    tenantId: 'tenant-001',
    tenantNif: 'B12345678',
    tenantName: 'Nexo Test S.L.',
    invoiceType: 'F1',
    fullNumber: 'A-2026-0001',
    issuedAt: new Date('2026-05-15T10:00:00Z'),
    dueAt: new Date('2026-06-15T10:00:00Z'),
    status: 'sent',
    subtotal: 100,
    vatAmount: 21,
    totalAmount: 121,
    notes: 'Servicios de limpieza',
    clientNif: 'B87654321',
    clientName: 'Cliente Prueba S.L.',
    lines: [
      {
        description: 'Limpieza mensual',
        quantity: 1,
        unitPrice: 100,
        vatRate: 21,
        subtotal: 100,
        vatAmount: 21,
        totalAmount: 121,
      },
    ],
    ...overrides,
  }
}

function makeRecord(overrides: Partial<InvoiceRecordData> = {}): InvoiceRecordData {
  return {
    id: 'rec-001',
    tenantId: 'tenant-001',
    invoiceId: 'inv-001',
    type: 'Alta',
    hash: 'abc123hash',
    previousHash: null,
    canonicalXml: '<xml/>',
    qrUrl: 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=B12345678&numserie=A-2026-0001&fecha=15-05-2026&importe=121.00',
    sentAt: new Date('2026-05-15T10:01:00Z'),
    aeatResponse: null,
    status: 'accepted',
    createdAt: new Date('2026-05-15T10:01:00Z'),
    ...overrides,
  }
}

// ── Mock fetch ───────────────────────────────────────────────────────────────

function mockFetch(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }),
  )
}

function mockFetchError(message: string) {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error(message)))
}

function mockFetchAbort() {
  const err = new Error('The operation was aborted')
  err.name = 'AbortError'
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(err))
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('VerifactiProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('constructor', () => {
    it('throws when API key is empty', () => {
      expect(() => new VerifactiProvider('')).toThrow(VerifactuProviderError)
    })

    it('accepts a valid API key', () => {
      const p = new VerifactiProvider(TEST_API_KEY)
      expect(p.name).toBe('verifacti')
    })
  })

  describe('submitInvoice', () => {
    it('returns success result on 201', async () => {
      mockFetch({ id: 'verifacti-rec-001', csv: 'ABC123XYZ456', estado_aeat: 'Correcto' }, 201)
      const provider = new VerifactiProvider(TEST_API_KEY, { baseUrl: TEST_BASE_URL, isProduction: false })
      const result = await provider.submitInvoice(makeInvoice())

      expect(result.success).toBe(true)
      expect(result.recordId).toBe('verifacti-rec-001')
      expect(result.csv).toBe('ABC123XYZ456')
      expect(result.qrUrl).toContain('prewww2.aeat.es')
    })

    it('uses api-returned qr_url when present', async () => {
      const customQr = 'https://custom.qr.url/test'
      mockFetch({ id: 'r1', csv: 'CSV1', estado_aeat: 'Correcto', qr_url: customQr }, 201)
      const provider = new VerifactiProvider(TEST_API_KEY)
      const result = await provider.submitInvoice(makeInvoice())

      expect(result.qrUrl).toBe(customQr)
    })

    it('sends correct Authorization header', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 'r1', csv: 'C1', estado_aeat: 'Correcto' }),
      })
      vi.stubGlobal('fetch', fetchSpy)

      const provider = new VerifactiProvider(TEST_API_KEY)
      await provider.submitInvoice(makeInvoice())

      const [, opts] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect((opts.headers as Record<string, string>)['Authorization']).toBe(`Bearer ${TEST_API_KEY}`)
    })

    it('sends correct request body fields', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 'r1', csv: 'C1', estado_aeat: 'Correcto' }),
      })
      vi.stubGlobal('fetch', fetchSpy)

      const provider = new VerifactiProvider(TEST_API_KEY)
      const invoice = makeInvoice()
      await provider.submitInvoice(invoice)

      const [, opts] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(opts.body as string) as Record<string, unknown>
      expect(body['IDEmisorFactura']).toBe(invoice.tenantNif)
      expect(body['NumSerieFactura']).toBe(invoice.fullNumber)
      expect(body['TipoFactura']).toBe('F1')
      expect(body['ImporteTotal']).toBe(121)
      expect(body['CuotaTotal']).toBe(21)
    })

    it('throws VerifactuAEATRejectionError when AEAT rejects', async () => {
      mockFetch({ id: 'r1', estado_aeat: 'Error en hash' }, 201)
      const provider = new VerifactiProvider(TEST_API_KEY)

      await expect(provider.submitInvoice(makeInvoice())).rejects.toThrow(VerifactuAEATRejectionError)
    })

    it('throws VerifactuProviderError on HTTP error', async () => {
      mockFetch({ message: 'Unauthorized' }, 401)
      const provider = new VerifactiProvider(TEST_API_KEY)

      await expect(provider.submitInvoice(makeInvoice())).rejects.toThrow(VerifactuProviderError)
    })

    it('throws VerifactuProviderError on network failure', async () => {
      mockFetchError('Network unreachable')
      const provider = new VerifactiProvider(TEST_API_KEY)

      await expect(provider.submitInvoice(makeInvoice())).rejects.toThrow(VerifactuProviderError)
    })

    it('throws VerifactuTimeoutError on abort', async () => {
      mockFetchAbort()
      const provider = new VerifactiProvider(TEST_API_KEY, { timeoutMs: 100 })

      await expect(provider.submitInvoice(makeInvoice())).rejects.toThrow(VerifactuTimeoutError)
    })

    it('aggregates lines by VAT rate into Desglose', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 'r1', csv: 'C1', estado_aeat: 'Correcto' }),
      })
      vi.stubGlobal('fetch', fetchSpy)

      const invoice = makeInvoice({
        lines: [
          { description: 'A', quantity: 1, unitPrice: 100, vatRate: 21, subtotal: 100, vatAmount: 21, totalAmount: 121 },
          { description: 'B', quantity: 1, unitPrice: 50, vatRate: 21, subtotal: 50, vatAmount: 10.5, totalAmount: 60.5 },
          { description: 'C', quantity: 1, unitPrice: 30, vatRate: 10, subtotal: 30, vatAmount: 3, totalAmount: 33 },
        ],
      })

      const provider = new VerifactiProvider(TEST_API_KEY)
      await provider.submitInvoice(invoice)

      const [, opts] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(opts.body as string) as { Desglose: unknown[] }
      expect(body.Desglose).toHaveLength(2) // two VAT rates: 21% and 10%
    })

    it('uses fallback description when notes is null', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 'r1', csv: 'C1', estado_aeat: 'Correcto' }),
      })
      vi.stubGlobal('fetch', fetchSpy)

      const provider = new VerifactiProvider(TEST_API_KEY)
      await provider.submitInvoice(makeInvoice({ notes: null }))

      const [, opts] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(opts.body as string) as { DescripcionOperacion: string }
      expect(body.DescripcionOperacion).toBe('Prestación de servicios')
    })
  })

  describe('cancelInvoice', () => {
    it('returns success result on cancellation', async () => {
      mockFetch({ id: 'verifacti-cancel-001', csv: 'CANCEL123' }, 201)
      const provider = new VerifactiProvider(TEST_API_KEY)
      const result = await provider.cancelInvoice(makeInvoice())

      expect(result.success).toBe(true)
      expect(result.recordId).toBe('verifacti-cancel-001')
    })

    it('sends only required cancellation fields', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 'c1' }),
      })
      vi.stubGlobal('fetch', fetchSpy)

      const invoice = makeInvoice()
      await new VerifactiProvider(TEST_API_KEY).cancelInvoice(invoice)

      const [, opts] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(opts.body as string) as Record<string, string>
      expect(body['IDEmisorFactura']).toBe(invoice.tenantNif)
      expect(body['NumSerieFactura']).toBe(invoice.fullNumber)
      expect(body['FechaExpedicionFactura']).toMatch(/^\d{2}-\d{2}-\d{4}$/)
    })

    it('throws VerifactuProviderError on HTTP error', async () => {
      mockFetch({ message: 'Not found' }, 404)
      await expect(new VerifactiProvider(TEST_API_KEY).cancelInvoice(makeInvoice())).rejects.toThrow(
        VerifactuProviderError,
      )
    })
  })

  describe('getRecordStatus', () => {
    it('returns SENT when estado_aeat is Correcto', async () => {
      mockFetch({ id: 'r1', estado_aeat: 'Correcto' })
      const status = await new VerifactiProvider(TEST_API_KEY).getRecordStatus('r1')
      expect(status).toBe('SENT')
    })

    it('returns PENDING when estado_aeat is No Registrado', async () => {
      mockFetch({ id: 'r1', estado_aeat: 'No Registrado' })
      const status = await new VerifactiProvider(TEST_API_KEY).getRecordStatus('r1')
      expect(status).toBe('PENDING')
    })

    it('returns ERROR when estado_aeat is unexpected', async () => {
      mockFetch({ id: 'r1', estado_aeat: 'Error en hash' })
      const status = await new VerifactiProvider(TEST_API_KEY).getRecordStatus('r1')
      expect(status).toBe('ERROR')
    })

    it('returns ERROR on network failure without throwing', async () => {
      mockFetchError('timeout')
      const status = await new VerifactiProvider(TEST_API_KEY).getRecordStatus('r1')
      expect(status).toBe('ERROR')
    })
  })

  describe('generateValidationUrl', () => {
    it('returns stored qrUrl when available', () => {
      const record = makeRecord({ qrUrl: 'https://stored.qr.url' })
      const url = new VerifactiProvider(TEST_API_KEY).generateValidationUrl(record)
      expect(url).toBe('https://stored.qr.url')
    })

    it('builds fallback AEAT URL when qrUrl is null', () => {
      const record = makeRecord({ qrUrl: null })
      const url = new VerifactiProvider(TEST_API_KEY, { isProduction: false }).generateValidationUrl(record)
      expect(url).toContain('prewww2.aeat.es')
      expect(url).toContain('ValidarQR')
    })

    it('uses production AEAT URL when isProduction=true', () => {
      const record = makeRecord({ qrUrl: null })
      const url = new VerifactiProvider(TEST_API_KEY, { isProduction: true }).generateValidationUrl(record)
      expect(url).toContain('www2.agenciatributaria.gob.es')
    })
  })

  describe('registerEmisor', () => {
    it('resolves successfully on 201', async () => {
      mockFetch({ id: 'emisor-001', NIF: 'B12345678' }, 201)
      await expect(
        new VerifactiProvider(TEST_API_KEY).registerEmisor('B12345678', 'Test S.L.'),
      ).resolves.toBeUndefined()
    })

    it('does not throw on 409 (already registered)', async () => {
      mockFetch({ message: 'Conflict' }, 409)
      await expect(
        new VerifactiProvider(TEST_API_KEY).registerEmisor('B12345678', 'Test S.L.'),
      ).resolves.toBeUndefined()
    })

    it('throws VerifactuProviderError on 500', async () => {
      mockFetch({ message: 'Internal server error' }, 500)
      await expect(
        new VerifactiProvider(TEST_API_KEY).registerEmisor('B12345678', 'Test S.L.'),
      ).rejects.toThrow(VerifactuProviderError)
    })

    it('sends NIF and NombreRazon in request body', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 'e1', NIF: 'B12345678' }),
      })
      vi.stubGlobal('fetch', fetchSpy)

      await new VerifactiProvider(TEST_API_KEY).registerEmisor('B12345678', 'Mi Empresa S.L.')

      const [, opts] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(opts.body as string) as Record<string, string>
      expect(body['NIF']).toBe('B12345678')
      expect(body['NombreRazon']).toBe('Mi Empresa S.L.')
    })
  })
})
