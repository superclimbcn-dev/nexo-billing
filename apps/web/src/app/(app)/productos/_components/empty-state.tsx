import Link from 'next/link'

export function EmptyState() {
  return (
    <div className="border border-dashed border-[var(--border)] rounded-lg p-12 text-center">
      <h2 className="text-xl font-medium text-[var(--text)] mb-2">
        Aún no tienes productos
      </h2>
      <p className="text-[var(--text-dim)] mb-6 max-w-md mx-auto">
        Añade tus servicios o productos al catálogo. Podrás reutilizarlos al crear facturas.
      </p>
      <Link
        href="/productos/nuevo"
        className="inline-block px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors"
      >
        + Crear el primer producto
      </Link>
    </div>
  )
}
