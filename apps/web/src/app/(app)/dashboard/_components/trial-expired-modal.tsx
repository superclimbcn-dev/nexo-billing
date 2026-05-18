'use client'

import Link from 'next/link'

export function TrialExpiredModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-[var(--surface)] border border-[var(--border-strong)] rounded-2xl p-8 shadow-2xl">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="[font-family:var(--font-serif)] text-2xl text-[var(--text)] mb-2">
          Tu periodo de prueba ha finalizado
        </h2>
        <p className="text-[var(--text-dim)] text-sm mb-6">
          Activa tu suscripción por <strong className="text-[var(--text)]">39€/mes</strong> para
          seguir facturando. Sin permanencia, cancela cuando quieras.
        </p>
        <Link
          href="/settings/billing"
          className="block w-full text-center px-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded-lg hover:bg-[var(--accent-dim)] transition-colors"
        >
          Activar SEPA →
        </Link>
        <p className="mt-4 text-xs text-[var(--text-subtle)] text-center">
          ¿Tienes dudas?{' '}
          <a href="mailto:hola@nexo-digital.app" className="text-[var(--accent)] hover:underline">
            Escríbenos
          </a>
        </p>
      </div>
    </div>
  )
}
