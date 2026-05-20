import 'server-only'

import { Resend } from 'resend'

type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

interface AlertTenant {
  id?: string | null
  name?: string | null
  nif?: string | null
}

interface InternalAlertInput {
  title: string
  stage: string
  severity?: AlertSeverity
  tenant?: AlertTenant
  event?: Record<string, string | number | boolean | null | undefined>
  details?: Record<string, unknown>
  error?: unknown
}

const DEFAULT_ALERT_EMAIL = 'contacto@nexo-digital.app'
const DEFAULT_FROM = 'Nexo Billing <facturas@nexo-billing.app>'
const SECRET_KEY_PATTERN = /(token|secret|password|authorization|api[_-]?key|access[_-]?key)/i

function serializeError(error: unknown): Record<string, unknown> | null {
  if (error == null) return null
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  return { message: String(error) }
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(
      value,
      (key, currentValue: unknown) => {
        if (SECRET_KEY_PATTERN.test(key)) return '[redacted]'
        return currentValue
      },
      2,
    )
  } catch {
    return String(value)
  }
}

function formatAlert(input: InternalAlertInput): string {
  const payload = {
    severity: input.severity ?? 'error',
    stage: input.stage,
    tenant: input.tenant,
    event: input.event,
    details: input.details,
    error: serializeError(input.error),
    createdAt: new Date().toISOString(),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
  }

  return [
    input.title,
    '',
    safeJson(payload),
    '',
    'Este alerta foi gerado automaticamente pelo Nexo Billing.',
  ].join('\n')
}

export async function sendInternalAlert(input: InternalAlertInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.INTERNAL_ALERT_EMAIL ?? process.env.NEXO_ALERT_EMAIL ?? DEFAULT_ALERT_EMAIL
  const from = process.env.INTERNAL_ALERT_FROM ?? process.env.EMAIL_FROM ?? DEFAULT_FROM
  const severity = input.severity ?? 'error'

  if (!apiKey) {
    console.warn('[internal-alerts] RESEND_API_KEY not configured', {
      stage: input.stage,
      title: input.title,
      severity,
    })
    return
  }

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from,
      to,
      subject: `[Nexo Billing][${severity.toUpperCase()}] ${input.stage}`,
      text: formatAlert(input),
    })
  } catch (error) {
    console.error('[internal-alerts] Failed to send alert email:', error)
  }
}
