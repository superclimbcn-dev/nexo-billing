'use client'

import { useRef, useState } from 'react'
import { uploadLogo, deleteLogo } from '../_lib/settings-actions'

interface Props {
  currentLogoUrl: string | null
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024

export function LogoUploader({ currentLogoUrl }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setClientError(null)
    setServerError(null)
    setSuccess(null)
    setSelectedFile(null)
    setPreview(null)

    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setClientError('Formato no permitido. Usa PNG, JPG, SVG o WebP.')
      return
    }
    if (file.size > MAX_BYTES) {
      setClientError('El archivo supera el límite de 2 MB.')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setServerError(null)
    setSuccess(null)

    const fd = new FormData()
    fd.append('file', selectedFile)

    const result = await uploadLogo(fd)
    setUploading(false)

    if (result.ok) {
      setLogoUrl(result.data.logoUrl)
      setPreview(null)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setSuccess('Logo actualizado correctamente.')
    } else {
      setServerError(result.error)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setDeleting(true)
    setServerError(null)
    setSuccess(null)
    setConfirmDelete(false)

    const result = await deleteLogo()
    setDeleting(false)

    if (result.ok) {
      setLogoUrl(null)
      setSuccess('Logo eliminado.')
    } else {
      setServerError(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <section className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-4">
        <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide">
          Logo actual
        </h2>

        {logoUrl ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Logo de la empresa"
                className="max-h-32 max-w-xs object-contain"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[var(--text-dim)]">
                Este logo aparecerá en tus facturas en PDF.
              </p>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm text-[var(--danger)] hover:underline disabled:opacity-50"
              >
                {deleting
                  ? 'Eliminando...'
                  : confirmDelete
                    ? '¿Confirmar eliminación?'
                    : 'Eliminar logo'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-dim)]">No hay logo configurado.</p>
        )}
      </section>

      <section className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg space-y-4">
        <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide">
          {logoUrl ? 'Cambiar logo' : 'Subir logo'}
        </h2>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-[var(--text)]">
            Archivo de imagen
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleFileChange}
            className="block text-sm text-[var(--text-dim)] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-[var(--border)] file:bg-[var(--surface-raised)] file:text-sm file:text-[var(--text)] hover:file:bg-[var(--surface-hover)] file:cursor-pointer"
          />
          <p className="text-xs text-[var(--text-dim)]">PNG, JPG, SVG o WebP · máx. 2 MB</p>
        </div>

        {clientError && <p className="text-sm text-[var(--danger)]">{clientError}</p>}

        {preview && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-dim)] uppercase tracking-wide font-medium">
              Vista previa
            </p>
            <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Vista previa" className="max-h-24 max-w-xs object-contain" />
            </div>
          </div>
        )}

        {serverError && <p className="text-sm text-[var(--danger)]">{serverError}</p>}
        {success && <p className="text-sm text-[var(--success)]">{success}</p>}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="px-6 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] text-[var(--bg)] hover:bg-[var(--accent-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Subiendo...' : 'Subir logo'}
        </button>
      </section>
    </div>
  )
}
