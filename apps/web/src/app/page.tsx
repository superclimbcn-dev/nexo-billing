import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing-nav'

export const metadata: Metadata = {
  title: 'Nexo Billing — Facturación inteligente para autónomos y PYMES',
  description:
    'Preparado para Verifactu 2027. Facturas ilimitadas, tesorería, impuestos y link público PWA. Desde 39€/mes.',
  openGraph: {
    title: 'Nexo Billing — Facturación inteligente',
    description: 'Preparado para Verifactu 2027. Desde 39€/mes.',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <MarketingNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-glow)] to-transparent opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--text-dim)] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
            Preparado para Verifactu 2027
          </div>
          <h1 className="[font-family:var(--font-serif)] text-4xl sm:text-5xl lg:text-6xl text-[var(--text)] leading-tight max-w-4xl mx-auto">
            Facturación inteligente para{' '}
            <span className="italic text-[var(--accent)]">autónomos</span> y{' '}
            <span className="italic text-[var(--accent)]">PYMES</span> españolas
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-[var(--text-dim)] max-w-2xl mx-auto">
            Crea facturas en segundos, controla tu tesorería y presenta impuestos
            sin estrés. Todo cumpliendo con la AEAT desde el primer día.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-3 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors text-base"
            >
              Empezar gratis
            </Link>
            <a
              href="#funciones"
              className="px-8 py-3 border border-[var(--border)] text-[var(--text-dim)] rounded-md hover:bg-[var(--surface-raised)] transition-colors text-base"
            >
              Ver funciones
            </a>
          </div>
        </div>
      </section>

      <InteractiveDemoSection />

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="funciones" className="py-20 sm:py-24 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="[font-family:var(--font-serif)] text-3xl sm:text-4xl text-[var(--text)]">
              Todo lo que necesitas para{' '}
              <span className="italic">facturar sin límites</span>
            </h2>
            <p className="mt-4 text-[var(--text-dim)] max-w-xl mx-auto">
              Diseñado para el día a día del autónomo español. Sin papeleo, sin
              complicaciones.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="⚡"
              title="Facturas en segundos"
              description="Crea y envía facturas profesionales con QR Verifactu en menos de un minuto. Numeración automática y series ilimitadas."
            />
            <FeatureCard
              icon="🛡️"
              title="Verifactu 2027 Ready"
              description="Envío directo a la AEAT, hash de encadenamiento, QR tributario y texto legal obligatorio en PDF."
            />
            <FeatureCard
              icon="📊"
              title="Tesorería e impuestos"
              description="Controla tu flujo de caja, visualiza cobros pendientes y calcula Modelo 303 y 130 automáticamente."
            />
            <FeatureCard
              icon="📱"
              title="Link público PWA"
              description="Tus clientes ven la factura en una página web elegante con opción de pago por transferencia."
            />
            <FeatureCard
              icon="👥"
              title="Gestor de equipo"
              description="Invita a tu contable con rol específico. El acceso a configuración fiscal está protegido."
            />
            <FeatureCard
              icon="📤"
              title="Exportación ZIP"
              description="Descarga todos tus documentos fiscales en formato ZIP listo para entregar a tu asesoría."
            />
          </div>
        </div>
      </section>

      {/* ── Social Proof ─────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-medium text-[var(--accent)] uppercase tracking-wide mb-4">
            Empresas que confían en Nexo Billing
          </p>
          <p className="[font-family:var(--font-serif)] text-3xl sm:text-4xl text-[var(--text)] max-w-3xl mx-auto">
            &ldquo;Antes perdía 2 horas semanales con la facturación. Ahora lo
            hago en 10 minutos.&rdquo;
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] flex items-center justify-center text-sm font-medium">
              JL
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--text)]">Juan López</p>
              <p className="text-xs text-[var(--text-dim)]">
                SuperClim — Instalaciones climatización
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="precios" className="py-20 sm:py-24 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="[font-family:var(--font-serif)] text-3xl sm:text-4xl text-[var(--text)]">
              Un solo plano, <span className="italic">sin sorpresas</span>
            </h2>
            <p className="mt-4 text-[var(--text-dim)] max-w-xl mx-auto">
              Todo incluido. Sin límites de facturas, sin permanencia, sin
              comisiones ocultas.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-center">
              <p className="text-sm text-[var(--text-dim)] uppercase tracking-wide">
                Plan Profesional
              </p>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-[var(--text)]">39€</span>
                <span className="text-[var(--text-dim)]">/mes</span>
              </div>
              <p className="mt-2 text-xs text-[var(--text-subtle)]">
                IVA no incluido · Pago por SEPA (GoCardless)
              </p>

              <ul className="mt-8 space-y-3 text-left">
                <PricingItem text="Facturas ilimitadas" />
                <PricingItem text="1 contable incluido" />
                <PricingItem text="Verifactu AEAT integrado" />
                <PricingItem text="Tesorería e impuestos (303 + 130)" />
                <PricingItem text="Link público PWA para clientes" />
                <PricingItem text="Exportación ZIP para asesoría" />
                <PricingItem text="Soporte por email prioritario" />
              </ul>

              <Link
                href="/login"
                className="mt-8 block w-full px-6 py-3 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors"
              >
                Crear cuenta
              </Link>
              <p className="mt-3 text-xs text-[var(--text-subtle)]">
                Sin permanencia. Cancela cuando quieras.
              </p>
              <div className="mt-4 p-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg text-left">
                <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                  <strong className="text-[var(--text)]">7 días gratis:</strong>{' '}
                  durante el periodo de prueba puedes crear facturas de práctica.
                  Verifactu AEAT se activa automáticamente al suscribirte.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 sm:py-24 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="[font-family:var(--font-serif)] text-3xl sm:text-4xl text-[var(--text)]">
              Preguntas <span className="italic">frecuentes</span>
            </h2>
          </div>

          <div className="space-y-4">
            <FaqItem
              question="¿Las facturas del periodo de prueba son válidas fiscalmente?"
              answer="Durante los 7 días de prueba, las facturas se generan en modo práctica y no se registran en la AEAT. Son perfectas para conocer el sistema. Al activar tu suscripción, Verifactu se activa automáticamente y todas tus nuevas facturas quedan registradas en la AEAT en tiempo real."
            />
            <FaqItem
              question="¿Es obligatorio Verifactu?"
              answer="Sí. A partir de 2027 todos los empresarios y profesionales españoles deben enviar sus facturas a la AEAT en tiempo real. Nexo Billing cumple con el RE-1693/2026 desde el primer día."
            />
            <FaqItem
              question="¿Puedo exportar datos para mi contable?"
              answer="Sí. Puedes descargar un ZIP con todos tus documentos fiscales (facturas, rectificativas, gastos) listo para entregar a tu asesoría. También puedes invitar a tu contable al equipo."
            />
            <FaqItem
              question="¿Qué pasa si no tengo IBAN configurado?"
              answer="El link público de la factura mostrará un mensaje pidiendo al cliente que consulte los datos bancarios. Configura tu IBAN en Ajustes para que aparezca automáticamente."
            />
            <FaqItem
              question="¿Hay app móvil?"
              answer="Nexo Billing es una PWA (Progressive Web App). Puedes instalarla en tu móvil desde el navegador y funciona como una app nativa, incluso sin conexión para consultar documentos."
            />
            <FaqItem
              question="¿Puedo cancelar en cualquier momento?"
              answer="Sí. No hay permanencia. Si cancelas, mantienes acceso durante 7 días adicionales (grace period) para descargar tus datos."
            />
            <FaqItem
              question="¿Cómo funciona el pago?"
              answer="El pago se realiza mediante domiciliación bancaria SEPA a través de GoCardless. Una vez al mes se carga el importe de tu cuenta. Puedes cancelar la domiciliación desde tu banco en cualquier momento."
            />
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <section id="about" className="py-20 sm:py-24 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="[font-family:var(--font-serif)] text-3xl sm:text-4xl text-[var(--text)]">
            Sobre <span className="italic text-[var(--accent)]">Nexo Billing</span>
          </h2>
          <p className="mt-6 text-[var(--text-dim)] leading-relaxed">
            Nexo Billing es un producto de <strong>Nexo Digital Unipersonal</strong>,
            una empresa española con sede en Barcelona. Nacimos con una misión clara:
            simplificar la facturación y la gestión fiscal para autónomos y PYMES,
            eliminando el papeleo innecesario y garantizando el cumplimiento con la AEAT
            desde el primer día.
          </p>
          <p className="mt-4 text-[var(--text-dim)] leading-relaxed">
            Estamos preparados para <strong>Verifactu 2027</strong> y trabajamos
            continuamente para que nuestros usuarios no tengan que preocuparse por
            los cambios normativos. Si tienes dudas, escríbenos a{' '}
            <a href="mailto:contacto@nexo-digital.app" className="text-[var(--accent)] hover:underline">
              contacto@nexo-digital.app
            </a>
            .
          </p>
        </div>
      </section>

      {/* ── CTA Footer ───────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="[font-family:var(--font-serif)] text-3xl sm:text-4xl text-[var(--text)]">
            Empieza a facturar <span className="italic text-[var(--accent)]">hoy mismo</span>
          </h2>
          <p className="mt-4 text-[var(--text-dim)]">
            Regístrate gratis y empieza a crear facturas en menos de 2 minutos.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block px-8 py-3 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors text-base"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <p className="text-lg font-bold">
                <span className="text-[var(--accent)]">Nexo</span> Billing
              </p>
              <p className="mt-2 text-sm text-[var(--text-dim)]">
                Facturación inteligente para autónomos y PYMES españolas.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)] mb-3">Legal</p>
              <div className="space-y-2 text-sm text-[var(--text-dim)]">
                <Link href="/terminos" className="block hover:text-[var(--text)] transition-colors">
                  Términos de servicio
                </Link>
                <Link href="/privacidad" className="block hover:text-[var(--text)] transition-colors">
                  Privacidad
                </Link>
                <Link href="/cookies" className="block hover:text-[var(--text)] transition-colors">
                  Cookies
                </Link>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)] mb-3">Contacto</p>
              <div className="space-y-2 text-sm text-[var(--text-dim)]">
                <p>contacto@nexo-digital.app</p>
                <p>Nexo Digital Unipersonal · Barcelona</p>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-[var(--border)] text-center text-xs text-[var(--text-subtle)]">
            © {new Date().getFullYear()} Nexo Digital Unipersonal Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function InteractiveDemoSection() {
  return (
    <section className="py-16 sm:py-20 border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--text-dim)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          Demo interactiva
        </div>
        <h2 className="mt-5 [font-family:var(--font-serif)] text-3xl sm:text-4xl text-[var(--text)]">
          Mira Nexo Billing en acción
        </h2>
        <p className="mt-4 text-[var(--text-dim)] max-w-2xl mx-auto">
          Explora cómo crear facturas, navegar por los módulos y preparar tu negocio
          para Verifactu 2027.
        </p>

        <div className="mt-10 mx-auto max-w-[1100px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_0_45px_rgba(203,255,77,0.08)]">
          <div className="aspect-video overflow-hidden rounded-lg bg-[var(--surface-raised)]">
            <iframe
              src="https://embed.app.guidde.com/playbooks/imR9yUFW8qNtptnpA749Bn?mode=videoOnly"
              title="Demo interactiva de Nexo Billing"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="clipboard-write"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts allow-forms allow-same-origin allow-presentation"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        </div>

        <Link
          href="/login"
          className="mt-8 inline-flex px-8 py-3 bg-[var(--accent)] text-[var(--bg)] font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors text-base"
        >
          Crear cuenta gratis
        </Link>
      </div>
    </section>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--border-strong)] transition-colors">
      <span className="text-2xl">{icon}</span>
      <h3 className="mt-4 text-lg font-medium text-[var(--text)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-dim)] leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function PricingItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-[var(--text)]">
      <span className="text-[var(--accent)]">✓</span>
      {text}
    </li>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-[var(--bg)] border border-[var(--border)] rounded-lg open:border-[var(--border-strong)] transition-colors">
      <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-medium text-[var(--text)] select-none">
        {question}
        <span className="text-[var(--text-dim)] group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>
      <p className="px-4 pb-4 text-sm text-[var(--text-dim)] leading-relaxed">
        {answer}
      </p>
    </details>
  )
}
