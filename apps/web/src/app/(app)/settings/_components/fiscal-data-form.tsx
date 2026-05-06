'use client'

import { useState } from 'react'
import { saveFiscalData } from '../_lib/settings-actions'

interface TenantData {
  name: string
  legalName: string | null
  nif: string
  country: string
  fiscalAddress: string | null
  fiscalCity: string | null
  fiscalPostal: string | null
  fiscalProvince: string | null
  iban: string | null
  email: string | null
  phone: string | null
  websiteUrl: string | null
}

interface Props {
  tenant: TenantData
}

type FieldErrors = Record<string, string[]>

export function FiscalDataForm({ tenant }: Props) {
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError(null)
    setFieldErrors({})

    const fd = new FormData(e.currentTarget)
    const raw = Object.fromEntries(fd.entries())

    const result = await saveFiscalData(raw)
    setSaving(false)

    if (result.ok) {
      setSuccess(true)
    } else {
      setError(result.error)
      if (result.fieldErrors) setFieldErrors(result.fieldErrors)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-4">
        <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide">
          Identificación
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Nombre comercial"
            name="name"
            defaultValue={tenant.name}
            disabled
            hint="No editable desde aquí"
          />
          <Field
            label="Razón social"
            name="legalName"
            defaultValue={tenant.legalName ?? ''}
            error={fieldErrors.legalName?.[0]}
            placeholder="Empresa S.L."
          />
        </div>

        <Field
          label="NIF / CIF"
          name="nif"
          defaultValue={tenant.nif}
          disabled
          hint="No editable desde aquí"
        />
      </section>

      <section className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-4">
        <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide">
          Dirección fiscal
        </h2>

        <Field
          label="Dirección"
          name="fiscalAddress"
          defaultValue={tenant.fiscalAddress ?? ''}
          error={fieldErrors.fiscalAddress?.[0]}
          placeholder="Calle Mayor, 1"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field
            label="Código postal"
            name="fiscalPostal"
            defaultValue={tenant.fiscalPostal ?? ''}
            error={fieldErrors.fiscalPostal?.[0]}
            placeholder="08001"
          />
          <div className="col-span-1 md:col-span-2">
            <Field
              label="Ciudad"
              name="fiscalCity"
              defaultValue={tenant.fiscalCity ?? ''}
              error={fieldErrors.fiscalCity?.[0]}
              placeholder="Barcelona"
            />
          </div>
          <Field
            label="Provincia"
            name="fiscalProvince"
            defaultValue={tenant.fiscalProvince ?? ''}
            error={fieldErrors.fiscalProvince?.[0]}
            placeholder="Barcelona"
          />
        </div>

        <div className="max-w-xs">
          <Field
            label="País"
            name="country"
            defaultValue={tenant.country}
            error={fieldErrors.country?.[0]}
            placeholder="ES"
            hint="Código ISO 2 letras (ES, FR, DE...)"
          />
        </div>
      </section>

      <section className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-4">
        <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide">
          Contacto y cobro
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Email de contacto"
            name="email"
            type="email"
            defaultValue={tenant.email ?? ''}
            error={fieldErrors.email?.[0]}
            placeholder="facturacion@empresa.com"
          />
          <Field
            label="Teléfono"
            name="phone"
            type="tel"
            defaultValue={tenant.phone ?? ''}
            error={fieldErrors.phone?.[0]}
            placeholder="+34 600 000 000"
          />
        </div>

        <Field
          label="IBAN"
          name="iban"
          defaultValue={tenant.iban ?? ''}
          error={fieldErrors.iban?.[0]}
          placeholder="ES12 1234 5678 9012 3456 7890"
          hint="Aparecerá en las facturas para domiciliación / transferencia"
        />

        <Field
          label="Sitio web"
          name="websiteUrl"
          type="url"
          defaultValue={tenant.websiteUrl ?? ''}
          error={fieldErrors.websiteUrl?.[0]}
          placeholder="https://www.empresa.com"
        />
      </section>

      {error && (
        <p className="text-sm text-[var(--danger)] px-1">{error}</p>
      )}

      {success && (
        <p className="text-sm text-[var(--success)] px-1">
          Datos guardados correctamente.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] text-[var(--bg)] hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  error,
  hint,
  placeholder,
  disabled,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  error?: string
  hint?: string
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-[var(--text)]">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {hint && !error && <p className="text-xs text-[var(--text-dim)]">{hint}</p>}
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  )
}
