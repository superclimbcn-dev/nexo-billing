import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing-nav'

export const metadata: Metadata = {
  title: 'Sobre nosotros — Nexo Billing',
  description: 'Somos Nexo Digital Unipersonal, una empresa española de Barcelona que simplifica la facturación para autónomos y PYMES.',
  alternates: { canonical: '/sobre-nosotros' },
}

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <MarketingNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h1 className="[font-family:var(--font-serif)] text-4xl sm:text-5xl text-[var(--text)]">
            Sobre <span className="italic text-[var(--accent)]">Nexo Billing</span>
          </h1>
        </div>

        <div className="space-y-8 text-[var(--text-dim)] leading-relaxed">
          <p>
            <strong className="text-[var(--text)]">Nexo Billing</strong> es un producto de{' '}
            <strong className="text-[var(--text)]">Nexo Digital Unipersonal</strong>, una empresa española
            con sede en Barcelona. Nacimos con una misión clara: simplificar la facturación y la gestión
            fiscal para autónomos y PYMES, eliminando el papeleo innecesario y garantizando el cumplimiento
            con la AEAT desde el primer día.
          </p>

          <p>
            La idea nació del día a día. Como operadores de{' '}
            <strong className="text-[var(--text)]">Superclim Servicios</strong> (empresa de
            instalaciones y climatización en Barcelona), vivimos en primera persona la complejidad de
            gestionar facturas, presupuestos e impuestos con las herramientas disponibles en el mercado.
            Ninguna nos convencía del todo: unas eran demasiado simples, otras demasiado caras o
            complicadas. Así que decidimos construir la nuestra.
          </p>

          <p>
            Estamos preparados para <strong className="text-[var(--text)]">Verifactu 2027</strong> y
            trabajamos continuamente para que nuestros usuarios no tengan que preocuparse por los
            cambios normativos. Quando la AEAT exige algo nuevo, Nexo Billing lo implementa antes
            de que sea obligatorio.
          </p>

          <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
            <h2 className="text-base font-semibold text-[var(--text)] mb-4">Datos de la empresa</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="text-[var(--text-subtle)] w-32 shrink-0">Razón social</dt>
                <dd>Nexo Digital Unipersonal</dd>
              </div>
              <div className="flex gap-3">
                <dt className="text-[var(--text-subtle)] w-32 shrink-0">Sede</dt>
                <dd>Barcelona, España</dd>
              </div>
              <div className="flex gap-3">
                <dt className="text-[var(--text-subtle)] w-32 shrink-0">Contacto</dt>
                <dd>
                  <a href="mailto:contacto@nexo-digital.app" className="text-[var(--accent)] hover:underline">
                    contacto@nexo-digital.app
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="pt-4">
            <h2 className="[font-family:var(--font-serif)] text-2xl text-[var(--text)] mb-6">
              Nuestros valores
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: '🛡️',
                  title: 'Cumplimiento primero',
                  description: 'El software que toca dinero y AEAT no puede fallar. Construimos con margen de seguridad.',
                },
                {
                  icon: '⚡',
                  title: 'Simplicidad radical',
                  description: 'Una tarea compleja no debe parecer compleja para el usuario. Diseñamos para el día a día.',
                },
                {
                  icon: '🤝',
                  title: 'Dogfooding real',
                  description: 'Usamos Nexo Billing para facturar Superclim. Cada dolor que sentimos, lo corregimos.',
                },
              ].map(({ icon, title, description }) => (
                <div key={title} className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                  <span className="text-2xl">{icon}</span>
                  <h3 className="mt-3 text-sm font-semibold text-[var(--text)]">{title}</h3>
                  <p className="mt-1 text-xs text-[var(--text-dim)] leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/login"
            className="inline-block px-8 py-3 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors"
          >
            Empezar gratis
          </Link>
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
