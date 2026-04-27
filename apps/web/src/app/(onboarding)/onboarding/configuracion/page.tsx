import { FormInput, Button } from '@nexo/core-ui'
import { createServerClient } from '@nexo/core-auth'
import { completeOnboarding } from '@/actions/onboarding'

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

const REGIMENES = [
  { value: 'general', label: 'Régimen General' },
  { value: 'recargo_equivalencia', label: 'Recargo de equivalencia' },
  { value: 'criterio_caja', label: 'Criterio de caja' },
  { value: 'exento', label: 'Exento de IVA (art. 20 LIVA)' },
]

const IVA_DEFAULTS = [
  { value: '21', label: '21% — Tipo general' },
  { value: '10', label: '10% — Tipo reducido' },
  { value: '4', label: '4% — Tipo superreducido' },
  { value: '0', label: '0% — Exento' },
]

export default async function ConfiguracionPage({ searchParams }: PageProps) {
  const { error } = await searchParams

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const currentYear = new Date().getFullYear().toString()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-[var(--text-subtle)] text-sm mb-1">Paso 5 de 5</p>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Configuración fiscal
        </h1>
        <p className="text-[var(--text-dim)] text-sm mt-2">
          Puedes cambiar esto más tarde en Ajustes.
        </p>
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl px-3 py-2.5">
          {decodeURIComponent(error)}
        </p>
      )}

      <form action={completeOnboarding} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="regimenIva" className="text-xs text-[var(--text-dim)]">
            Régimen de IVA
          </label>
          <select
            id="regimenIva"
            name="regimenIva"
            defaultValue="general"
            className="bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-[var(--text)] text-sm outline-none transition-colors duration-150 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]"
          >
            {REGIMENES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ivaDefault" className="text-xs text-[var(--text-dim)]">
            IVA por defecto
          </label>
          <select
            id="ivaDefault"
            name="ivaDefault"
            defaultValue="21"
            className="bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-[var(--text)] text-sm outline-none transition-colors duration-150 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]"
          >
            {IVA_DEFAULTS.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </div>

        <FormInput
          id="anioFiscal"
          name="anioFiscal"
          type="number"
          label="Año fiscal de inicio"
          defaultValue={currentYear}
          min="2020"
          max="2030"
        />

        <FormInput
          id="emailNotificaciones"
          name="emailNotificaciones"
          type="email"
          label="Email para notificaciones"
          placeholder={user?.email ?? ''}
          defaultValue={user?.email ?? ''}
          autoComplete="email"
        />

        <div className="flex items-start gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3.5">
          <input
            type="checkbox"
            id="acceptedTyC"
            name="acceptedTyC"
            required
            className="mt-0.5 accent-[var(--accent)] w-4 h-4 cursor-pointer"
          />
          <label htmlFor="acceptedTyC" className="text-sm text-[var(--text-dim)] cursor-pointer">
            Acepto los{' '}
            <a
              href="/legal/terminos"
              target="_blank"
              className="text-[var(--accent)] hover:underline"
            >
              Términos y Condiciones
            </a>{' '}
            y la{' '}
            <a
              href="/legal/privacidad"
              target="_blank"
              className="text-[var(--accent)] hover:underline"
            >
              Política de Privacidad
            </a>
          </label>
        </div>

        <div className="flex justify-between pt-2">
          <a href="/onboarding/vertical">
            <Button type="button" variant="secondary">
              ← Atrás
            </Button>
          </a>
          <Button type="submit" variant="primary">
            Finalizar registro →
          </Button>
        </div>
      </form>
    </div>
  )
}
