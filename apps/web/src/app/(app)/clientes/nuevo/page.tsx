import { ClientForm } from '../_components/client-form'

export default function NuevoClientePage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <header>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Nuevo cliente
        </h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          Añade los datos fiscales del cliente.
        </p>
      </header>
      <ClientForm mode="create" />
    </div>
  )
}
