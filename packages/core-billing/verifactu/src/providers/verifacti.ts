import type { IVerifactuProvider } from './interface'
import type { InvoiceData, InvoiceRecordData, VerifactuResult } from './types'
import {
  VerifactuProviderError,
  VerifactuTimeoutError,
  VerifactuAEATRejectionError,
} from '../errors'
import { generateAEATQRUrlFromInvoice } from '../qr/aeat-qr'

const DEFAULT_BASE_URL = 'https://app.verifactuapi.es'
const DEFAULT_TIMEOUT_MS = 15_000

/** Minimal shape of Verifacti API responses we care about */
interface VerifactiResponse {
  id?: string
  csv?: string
  estado_aeat?: string
  qr_url?: string
  message?: string
  error?: string
}

interface VerifactiEmitterResponse {
  id?: string
  NIF?: string
  message?: string
  error?: string
}

function formatDateDMY(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}-${m}-${y}`
}

/** Aggregate invoice lines by VAT rate for Desglose field */
function buildDesglose(lines: InvoiceData['lines']): object[] {
  const groups = new Map<number, { tipoImpositivo: number; baseImponible: number; cuotaRepercutida: number }>()

  for (const line of lines) {
    const existing = groups.get(line.vatRate)
    if (existing) {
      existing.baseImponible = parseFloat((existing.baseImponible + line.subtotal).toFixed(2))
      existing.cuotaRepercutida = parseFloat((existing.cuotaRepercutida + line.vatAmount).toFixed(2))
    } else {
      groups.set(line.vatRate, {
        tipoImpositivo: line.vatRate,
        baseImponible: parseFloat(line.subtotal.toFixed(2)),
        cuotaRepercutida: parseFloat(line.vatAmount.toFixed(2)),
      })
    }
  }

  return Array.from(groups.values()).map((g) => ({
    Sujeta: {
      NoExenta: {
        TipoNoExenta: 'S1',
        DesgloseIVA: {
          DetalleIVA: {
            TipoImpositivo: g.tipoImpositivo,
            BaseImponible: g.baseImponible,
            CuotaRepercutida: g.cuotaRepercutida,
          },
        },
      },
    },
  }))
}

export interface VerifactiProviderOptions {
  baseUrl?: string
  timeoutMs?: number
  /** true = AEAT producción, false = AEAT pruebas (default: NODE_ENV === 'production') */
  isProduction?: boolean
}

/**
 * Production Verifactu provider that submits invoices to AEAT via the Verifacti API.
 *
 * Docs: https://app.verifactuapi.es/docs/
 * Auth: Bearer token (VERIFACTU_API_KEY)
 * Errors: wrapped in VerifactuProviderError / VerifactuTimeoutError / VerifactuAEATRejectionError
 */
export class VerifactiProvider implements IVerifactuProvider {
  readonly name = 'verifacti'

  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly timeoutMs: number
  private readonly isProduction: boolean

  constructor(apiKey: string, options: VerifactiProviderOptions = {}) {
    if (!apiKey) {
      throw new VerifactuProviderError('VERIFACTU_API_KEY is required', 'verifacti')
    }
    this.apiKey = apiKey
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '')
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.isProduction = options.isProduction ?? process.env.NODE_ENV === 'production'
  }

  async submitInvoice(invoice: InvoiceData): Promise<VerifactuResult> {
    const body = {
      IDEmisorFactura: invoice.tenantNif,
      NumSerieFactura: invoice.fullNumber,
      FechaExpedicionFactura: formatDateDMY(invoice.issuedAt),
      TipoFactura: invoice.invoiceType || 'F1',
      DescripcionOperacion: invoice.notes?.trim() || 'Prestación de servicios',
      RefExterna: invoice.id,
      Destinatarios: [
        {
          NIF: invoice.clientNif,
          NombreRazon: invoice.clientName,
        },
      ],
      Desglose: buildDesglose(invoice.lines),
      CuotaTotal: parseFloat(invoice.vatAmount.toFixed(2)),
      ImporteTotal: parseFloat(invoice.totalAmount.toFixed(2)),
    }

    const raw = await this.request<VerifactiResponse>('POST', '/api/alta-registro-facturacion', body)

    if (
      raw.estado_aeat &&
      raw.estado_aeat !== 'Correcto' &&
      raw.estado_aeat !== 'No Registrado' &&
      raw.estado_aeat !== 'Registrado'
    ) {
      throw new VerifactuAEATRejectionError(
        `AEAT rechazó el registro: ${raw.estado_aeat}`,
        'AEAT_REJECTION',
        raw.estado_aeat,
      )
    }

    const recordId = raw.id ?? `verifacti-${invoice.id}`
    const csv = raw.csv ?? ''
    const qrUrl =
      raw.qr_url ??
      generateAEATQRUrlFromInvoice(
        invoice.tenantNif,
        invoice.fullNumber,
        invoice.issuedAt,
        invoice.totalAmount,
        this.isProduction,
      )

    console.log(
      `[Verifacti] submitInvoice OK | invoice=${invoice.fullNumber} recordId=${recordId} estado=${raw.estado_aeat ?? 'pending'}`,
    )

    return { success: true, recordId, csv, qrUrl }
  }

  async cancelInvoice(invoice: InvoiceData): Promise<VerifactuResult> {
    const body = {
      IDEmisorFactura: invoice.tenantNif,
      NumSerieFactura: invoice.fullNumber,
      FechaExpedicionFactura: formatDateDMY(invoice.issuedAt),
    }

    const raw = await this.request<VerifactiResponse>(
      'POST',
      '/api/anulacion-registro-facturacion',
      body,
    )

    const recordId = raw.id ?? `verifacti-cancel-${invoice.id}`
    console.log(`[Verifacti] cancelInvoice OK | invoice=${invoice.fullNumber} recordId=${recordId}`)

    return { success: true, recordId, csv: raw.csv }
  }

  generateValidationUrl(record: InvoiceRecordData): string {
    if (record.qrUrl) return record.qrUrl
    // Fallback: build without NIF (NIF should always be in qrUrl)
    return generateAEATQRUrlFromInvoice('', record.invoiceId, record.createdAt, 0, this.isProduction)
  }

  async getRecordStatus(recordId: string): Promise<'PENDING' | 'SENT' | 'ERROR'> {
    try {
      const raw = await this.request<VerifactiResponse>(
        'GET',
        `/api/alta-registro-facturacion/${encodeURIComponent(recordId)}`,
      )

      if (!raw.estado_aeat || raw.estado_aeat === 'No Registrado') return 'PENDING'
      if (raw.estado_aeat === 'Correcto' || raw.estado_aeat === 'Registrado') return 'SENT'
      return 'ERROR'
    } catch {
      return 'ERROR'
    }
  }

  /**
   * Register a tenant NIF as an emitter in Verifacti.
   * Idempotent — safe to call multiple times for the same NIF.
   * Called during onboarding and when fiscal data is updated.
   */
  async registerEmisor(nif: string, razonSocial: string): Promise<void> {
    try {
      await this.request<VerifactiEmitterResponse>('POST', '/api/emisor', {
        NIF: nif,
        NombreRazon: razonSocial,
      })
      console.log(`[Verifacti] registerEmisor OK | nif=${nif}`)
    } catch (err) {
      // 409 Conflict means the NIF is already registered — not an error for us
      if (err instanceof VerifactuProviderError && err.message.includes('409')) {
        console.log(`[Verifacti] registerEmisor already registered | nif=${nif}`)
        return
      }
      throw err
    }
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)

    // TODO: remove after confirming API key reaches runtime
    console.log('[Verifacti] request | key_length:', this.apiKey.length, 'key_prefix:', this.apiKey.substring(0, 8), 'isProduction:', this.isProduction)

    let response: Response
    try {
      response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new VerifactuTimeoutError(
          `Verifacti request timed out after ${this.timeoutMs}ms: ${method} ${path}`,
          this.timeoutMs,
        )
      }
      const msg = err instanceof Error ? err.message : String(err)
      throw new VerifactuProviderError(`Verifacti request failed: ${msg}`, 'verifacti')
    } finally {
      clearTimeout(timer)
    }

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`
      try {
        const rawText = await response.text()
        console.log(`[Verifacti] error ${response.status} | body:`, rawText)
        const errBody = JSON.parse(rawText) as { message?: string; error?: string }
        errorMsg = errBody.message ?? errBody.error ?? (rawText || errorMsg)
      } catch {
        // ignore JSON parse errors on error responses
      }
      throw new VerifactuProviderError(
        `Verifacti API error (${response.status}): ${errorMsg}`,
        'verifacti',
      )
    }

    return response.json() as Promise<T>
  }
}
