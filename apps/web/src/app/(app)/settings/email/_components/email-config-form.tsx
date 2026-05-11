'use client'

import { useState, useTransition } from 'react'
import {
  saveEmailConfig,
  testEmailConfig,
  type EmailConfigInput,
} from '../../_lib/email-config-actions'

interface Props {
  initial: EmailConfigInput
}

export function EmailConfigForm({ initial }: Props) {
  const [form, setForm] = useState<EmailConfigInput>(initial)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isTesting, startTest] = useTransition()

  function handleChange(
    field: keyof EmailConfigInput,
    value: string | boolean | number,
  ) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setFieldErrors({})

    startTransition(async () => {
      const res = await saveEmailConfig(form)
      if (!res.ok) {
        setError(res.error)
        if (res.fieldErrors) setFieldErrors(res.fieldErrors)
      } else {
        setSuccess(res.data.message)
      }
    })
  }

  function handleTest() {
    setError(null)
    setSuccess(null)
    startTest(async () => {
      const res = await testEmailConfig()
      if (!res.ok) {
        setError(res.error)
      } else {
        setSuccess(res.data.message)
      }
    })
  }

  const showSmtp = form.provider === 'smtp'
  const showApiKey = form.provider === 'resend' || form.provider === 'sendgrid'

  const inputClass =
    'w-full px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm focus:outline-none focus:border-[var(--accent)] transition-colors'
  const labelClass = 'block text-sm font-medium text-[var(--text)] mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-md">
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-100/10 border border-green-200/30 rounded-md">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {/* Provider */}
      <div>
        <label className={labelClass}>Proveedor de email</label>
        <select
          value={form.provider}
          onChange={(e) => handleChange('provider', e.target.value)}
          className={inputClass}
        >
          <option value="resend">Resend</option>
          <option value="sendgrid">SendGrid</option>
          <option value="smtp">SMTP personalizado</option>
        </select>
      </div>

      {/* API Key */}
      {showApiKey && (
        <div>
          <label className={labelClass}>API Key</label>
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            placeholder="re_... o SG_..."
            className={inputClass}
          />
          <p className="text-xs text-[var(--text-subtle)] mt-1">
            Se dejas en blanco, se usará la API key global de la plataforma.
          </p>
        </div>
      )}

      {/* SMTP fields */}
      {showSmtp && (
        <div className="space-y-4 p-4 bg-[var(--surface-raised)] rounded-lg border border-[var(--border)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Host SMTP</label>
              <input
                type="text"
                value={form.smtpHost}
                onChange={(e) => handleChange('smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
                className={inputClass}
              />
              {fieldErrors.smtpHost && (
                <p className="text-xs text-[var(--danger)] mt-1">
                  {fieldErrors.smtpHost[0]}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Puerto</label>
              <input
                type="number"
                value={form.smtpPort ?? ''}
                onChange={(e) => handleChange('smtpPort', Number(e.target.value))}
                placeholder="587"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Usuario SMTP</label>
            <input
              type="text"
              value={form.smtpUser}
              onChange={(e) => handleChange('smtpUser', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Contraseña SMTP</label>
            <input
              type="password"
              value={form.smtpPass}
              onChange={(e) => handleChange('smtpPass', e.target.value)}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--text-dim)] cursor-pointer">
            <input
              type="checkbox"
              checked={form.smtpSecure}
              onChange={(e) => handleChange('smtpSecure', e.target.checked)}
              className="rounded border-[var(--border)] bg-[var(--surface-raised)]"
            />
            Usar TLS/SSL (seguro)
          </label>
        </div>
      )}

      {/* Sender details */}
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Email de envío</label>
          <input
            type="email"
            value={form.from}
            onChange={(e) => handleChange('from', e.target.value)}
            placeholder="facturas@tuempresa.com"
            className={inputClass}
          />
          <p className="text-xs text-[var(--text-subtle)] mt-1">
            Debe estar verificado en tu proveedor de email.
          </p>
        </div>
        <div>
          <label className={labelClass}>Nombre del remitente</label>
          <input
            type="text"
            value={form.fromName}
            onChange={(e) => handleChange('fromName', e.target.value)}
            placeholder="Tu Empresa S.L."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Email de respuesta (reply-to)</label>
          <input
            type="email"
            value={form.replyTo}
            onChange={(e) => handleChange('replyTo', e.target.value)}
            placeholder="contacto@tuempresa.com"
            className={inputClass}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Guardando...' : 'Guardar configuración'}
        </button>
        <button
          type="button"
          onClick={handleTest}
          disabled={isTesting}
          className="px-4 py-2 border border-[var(--border)] text-[var(--text-dim)] rounded-md hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-colors"
        >
          {isTesting ? 'Enviando...' : 'Enviar email de prueba'}
        </button>
      </div>
    </form>
  )
}
