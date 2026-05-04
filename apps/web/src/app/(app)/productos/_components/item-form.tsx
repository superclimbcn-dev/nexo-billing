'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { Item } from '@nexo/prisma'
import { createItem, updateItem } from '../_lib/item-actions'
import { VAT_OPTIONS } from '../_lib/item-schema'

interface ItemFormProps {
  mode: 'create' | 'edit'
  itemId?: string
  initialData?: Partial<Item>
}

export function ItemForm({ mode, itemId, initialData }: ItemFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const defaultPrice =
    initialData?.unitPrice != null
      ? parseFloat(initialData.unitPrice.toString()).toFixed(2).replace('.', ',')
      : ''

  const defaultVat =
    initialData?.vatRate != null
      ? String(Math.round(parseFloat(initialData.vatRate.toString())))
      : '21'

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setGeneralError(null)

    const formData = new FormData(e.currentTarget)
    const raw = Object.fromEntries(formData.entries())

    startTransition(async () => {
      if (mode === 'create') {
        const res = await createItem(raw)
        if (res.ok) {
          router.push(`/productos/${res.data.id}`)
        } else {
          setGeneralError(res.error)
          if (res.fieldErrors) setErrors(res.fieldErrors)
        }
      } else {
        const res = await updateItem(itemId!, raw)
        if (res.ok) {
          router.push('/productos')
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
        label="Nombre *"
        name="name"
        defaultValue={initialData?.name ?? ''}
        errors={errors.name}
        placeholder="Ej. Limpieza mensual de oficina"
      />

      <Field
        label="Descripción"
        name="description"
        type="textarea"
        defaultValue={initialData?.description ?? ''}
        errors={errors.description}
        placeholder="Descripción detallada del producto o servicio"
      />

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Tipo *"
          name="type"
          defaultValue={initialData?.type ?? 'service'}
          errors={errors.type}
          options={[
            { value: 'service', label: 'Servicio' },
            { value: 'product', label: 'Producto' },
          ]}
        />
        <Field
          label="Unidad"
          name="unit"
          defaultValue={initialData?.unit ?? ''}
          errors={errors.unit}
          placeholder="ud, hora, m², kg..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Precio unitario *"
          name="unitPrice"
          defaultValue={defaultPrice}
          errors={errors.unitPrice}
          placeholder="0,00"
        />
        <SelectField
          label="IVA *"
          name="vatRate"
          defaultValue={defaultVat}
          errors={errors.vatRate}
          options={VAT_OPTIONS.map((v) => ({ value: v, label: `${v}%` }))}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] disabled:opacity-50 transition-colors"
        >
          {isPending
            ? 'Guardando...'
            : mode === 'create'
              ? 'Crear producto'
              : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/productos')}
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
}: {
  label: string
  name: string
  defaultValue: string
  errors?: string[]
  type?: string
  placeholder?: string
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
          className={inputClass}
        />
      )}
      {errors && errors.length > 0 && (
        <p className="mt-1 text-sm text-[var(--danger)]">{errors[0]}</p>
      )}
    </div>
  )
}

function SelectField({
  label,
  name,
  defaultValue,
  errors,
  options,
}: {
  label: string
  name: string
  defaultValue: string
  errors?: string[]
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-[var(--text)] mb-1">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {errors && errors.length > 0 && (
        <p className="mt-1 text-sm text-[var(--danger)]">{errors[0]}</p>
      )}
    </div>
  )
}
