import { ItemForm } from '../_components/item-form'

export default function NuevoProductoPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <header>
        <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
          Nuevo producto
        </h1>
        <p className="text-sm text-[var(--text-dim)] mt-1">
          Añade un servicio o producto al catálogo.
        </p>
      </header>
      <ItemForm mode="create" />
    </div>
  )
}
