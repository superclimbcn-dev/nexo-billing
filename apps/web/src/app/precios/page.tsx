import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing-nav'

export const metadata: Metadata = {
  title: 'Precios — Nexo Billing',
  description: 'Un solo plan, sin sorpresas. 39€/mes con facturas ilimitadas, Verifactu integrado y sin permanencia.',
  alternates: { canonical: '/precios' },
}

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-[var(--text)]">
      <span className="text-[var(--accent)]">✓</span>
      {text}
    </li>
  )
}

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <MarketingNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h1 className="[font-family:var(--font-serif)] text-4xl sm:text-5xl text-[var(--text)]">
            Un solo plan, <span className="italic text-[var(--accent)]">sin sorpresas</span>
          </h1>
          <p className="mt-4 text-[var(--text-dim)] max-w-xl mx-auto">
            Todo incluido. Sin límites de facturas, sin permanencia, sin comisiones ocultas.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-center">
            <p className="text-sm text-[var(--text-dim)] uppercase tracking-wide">Plan Profesional</p>
            <div className="mt-4 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-[var(--text)]">39€</span>
              <span className="text-[var(--text-dim)]">/mes</span>
            </div>
            <p className="mt-2 text-xs text-[var(--text-subtle)]">IVA no incluido · Pago por SEPA (GoCardless)</p>

            <ul className="mt-8 space-y-3 text-left">
              <CheckItem text="Facturas ilimitadas" />
              <CheckItem text="1 contable incluido" />
              <CheckItem text="Verifactu AEAT integrado" />
              <CheckItem text="Tesorería e impuestos (303 + 130)" />
              <CheckItem text="Link público PWA para clientes" />
              <CheckItem text="Exportación ZIP para asesoría" />
              <CheckItem text="Soporte por email prioritario" />
            </ul>

            <Link
              href="/login"
              className="mt-8 block w-full px-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors"
            >
              Crear cuenta gratis
            </Link>
            <p className="mt-3 text-xs text-[var(--text-subtle)]">Sin permanencia. Cancela cuando quieras.</p>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mt-20">
          <h2 className="[font-family:var(--font-serif)] text-2xl sm:text-3xl text-center text-[var(--text)] mb-10">
            ¿Qué incluye el plan?
          </h2>

          {/* Column headers */}
          <div className="max-w-2xl mx-auto flex items-center justify-end gap-0 mb-2 px-5">
            <span className="w-32 text-center text-xs font-medium text-[var(--text-subtle)]">Trial · 7 días</span>
            <span className="w-32 text-center text-xs font-medium text-[var(--accent)]">Pro · 39€/mes</span>
          </div>

          <div className="max-w-2xl mx-auto space-y-2">
            {([
              ['Facturas y presupuestos', 'Ilimitados', 'Ilimitados'],
              ['Series de facturación', 'Ilimitadas', 'Ilimitadas'],
              ['Clientes', 'Ilimitados', 'Ilimitados'],
              ['Rectificativas y anulaciones', 'Incluido', 'Incluido'],
              ['Verifactu AEAT', 'Práctica', '✅ En tiempo real'],
              ['QR tributario en PDF', 'Incluido', 'Incluido'],
              ['Link público de factura (PWA)', 'Incluido', 'Incluido'],
              ['Tesorería y flujo de caja', 'Incluido', 'Incluido'],
              ['Modelo 303 y 130 automático', 'Incluido', 'Incluido'],
              ['Exportación ZIP asesoría', 'Incluido', 'Incluido'],
              ['Invitación contable', '1 usuario', '1 usuario'],
              ['Soporte por email', 'Normal', 'Prioritario'],
            ] as [string, string, string][]).map(([feature, trial, pro]) => {
              const isDifferent = trial !== pro
              return (
                <div
                  key={feature}
                  className={`flex items-center px-5 py-3 rounded-lg text-sm border ${
                    isDifferent
                      ? 'bg-[var(--accent)]/5 border-[var(--accent)]/20'
                      : 'bg-[var(--surface)] border-[var(--border)]'
                  }`}
                >
                  <span className="flex-1 text-[var(--text-dim)]">{feature}</span>
                  <span className={`w-32 text-center text-xs font-medium ${isDifferent ? 'text-[var(--text-subtle)]' : 'text-[var(--accent)]'}`}>
                    {trial}
                  </span>
                  <span className="w-32 text-center text-xs font-medium text-[var(--accent)]">
                    {pro}
                  </span>
                </div>
              )
            })}
          </div>

          <p className="max-w-2xl mx-auto mt-4 px-1 text-xs text-[var(--text-subtle)]">
            * Verifactu en modo práctica: las facturas no se registran en la AEAT durante el trial.
            Al activar tu suscripción, Verifactu se activa automáticamente para todas las nuevas facturas.
          </p>
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
