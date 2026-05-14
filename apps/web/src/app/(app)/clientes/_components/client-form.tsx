'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { Client } from '@nexo/prisma'
import { createClient, updateClient } from '../_lib/client-actions'

interface ClientFormProps {
  mode: 'create' | 'edit'
  clientId?: string
  initialData?: Partial<Client>
}

export function ClientForm({ mode, clientId, initialData }: ClientFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setGeneralError(null)

    const formData = new FormData(e.currentTarget)
    const raw = Object.fromEntries(formData.entries())

    startTransition(async () => {
      if (mode === 'create') {
        const res = await createClient(raw)
        if (res.ok) {
          router.push(`/clientes/${res.data.id}`)
        } else {
          setGeneralError(res.error)
          if (res.fieldErrors) setErrors(res.fieldErrors)
        }
      } else {
        const res = await updateClient(clientId!, raw)
        if (res.ok) {
          router.push(`/clientes/${clientId}`)
          router.refresh()
        } else {
          setGeneralError(res.error)
          if (res.fieldErrors) setErrors(res.fieldErrors)
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {generalError && (
        <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-md text-[var(--danger)] text-sm">
          {generalError}
        </div>
      )}

      <Field
        label="Nombre / Razón social *"
        name="name"
        defaultValue={initialData?.name ?? ''}
        errors={errors.name}
        required
      />
      <Field
        label="NIF / CIF / NIE *"
        name="nif"
        defaultValue={initialData?.nif ?? ''}
        errors={errors.nif}
        placeholder="B12345678"
      />
      <Field
        label="Nombre legal"
        name="legalName"
        defaultValue={initialData?.legalName ?? ''}
        errors={errors.legalName}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={initialData?.email ?? ''}
        errors={errors.email}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Teléfono"
          name="phone"
          defaultValue={initialData?.phone ?? ''}
          errors={errors.phone}
        />
        <Field
          label="Persona de contacto"
          name="contactPerson"
          defaultValue={initialData?.contactPerson ?? ''}
          errors={errors.contactPerson}
        />
      </div>
      <Field
        label="Dirección"
        name="address"
        defaultValue={initialData?.address ?? ''}
        errors={errors.address}
      />
      <div className="grid grid-cols-3 gap-4">
        <Field
          label="Código postal"
          name="postalCode"
          defaultValue={initialData?.postalCode ?? ''}
          errors={errors.postalCode}
          placeholder="08001"
        />
        <Field
          label="Ciudad"
          name="city"
          defaultValue={initialData?.city ?? ''}
          errors={errors.city}
        />
        <Field
          label="Provincia"
          name="province"
          defaultValue={initialData?.province ?? ''}
          errors={errors.province}
        />
      </div>
      <Field
        label="Notas"
        name="notes"
        type="textarea"
        defaultValue={initialData?.notes ?? ''}
        errors={errors.notes}
      />

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors"
        >
          {isPending
            ? 'Guardando...'
            : mode === 'create'
              ? 'Crear cliente'
              : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={() => router.push(clientId ? `/clientes/${clientId}` : '/clientes')}
          className="px-4 py-2 border border-[var(--border)] rounded-md text-[var(--text-dim)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  defaultValue,
  errors,
  type = 'text',
  placeholder,
  required,
}: {
  label: string
  name: string
  defaultValue: string
  errors?: string[]
  type?: string
  placeholder?: string
  required?: boolean
}) {
  const inputClass =
    'w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors'

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-[var(--text)] mb-1">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          rows={3}
          className={inputClass}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          className={inputClass}
        />
      )}
      {errors && errors.length > 0 && (
        <p className="mt-1 text-sm text-[var(--danger)]">{errors[0]}</p>
      )}
    </div>
  )
}
