import type { Metadata } from 'next'
import { MarketingNav } from '@/components/marketing-nav'

export const metadata: Metadata = {
  title: 'Contacto — Nexo Billing',
  description: 'Contacta con el equipo de Nexo Billing. Estamos aquí para ayudarte con cualquier duda sobre facturación y Verifactu.',
  alternates: { canonical: '/contacto' },
}

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <MarketingNav />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h1 className="[font-family:var(--font-serif)] text-4xl sm:text-5xl text-[var(--text)]">
            Hablemos
          </h1>
          <p className="mt-4 text-[var(--text-dim)]">
            ¿Tienes dudas sobre Nexo Billing o sobre Verifactu? Escríbenos.
          </p>
        </div>

        <div className="space-y-4">
          <a
            href="mailto:contacto@nexo-digital.app"
            className="flex items-start gap-4 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--border-strong)] transition-colors group"
          >
            <span className="text-2xl">✉️</span>
            <div>
              <p className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                Email general
              </p>
              <p className="text-sm text-[var(--text-dim)] mt-0.5">contacto@nexo-digital.app</p>
              <p className="text-xs text-[var(--text-subtle)] mt-1">
                Respondemos en menos de 24 h en días laborables (CET/CEST)
              </p>
            </div>
          </a>

          <div className="flex items-start gap-4 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
            <span className="text-2xl">🏢</span>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Dirección</p>
              <p className="text-sm text-[var(--text-dim)] mt-0.5">
                Nexo Digital Unipersonal<br />
                Barcelona, España
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Horario de soporte</p>
              <p className="text-sm text-[var(--text-dim)] mt-0.5">
                Lunes a viernes, 9:00 – 18:00 (CET/CEST)
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl">
          <p className="text-sm font-medium text-[var(--text)] mb-2">¿Eres cliente con cuenta activa?</p>
          <p className="text-sm text-[var(--text-dim)]">
            Accede a tu panel y usa el canal de soporte integrado para recibir atención prioritaria
            con contexto de tu cuenta.
          </p>
          <a
            href="/login"
            className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Ir al panel →
          </a>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-[var(--text-subtle)]">
          <span><span className="text-[var(--accent)]">Nexo</span> Billing</span>
          <span>© {new Date().getFullYear()} Nexo Digital Unipersonal</span>
        </div>
      </footer>
    </div>
  )
}
