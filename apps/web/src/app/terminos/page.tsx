import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos de Servicio — Nexo Billing',
  description: 'Condiciones de uso de Nexo Billing. Contrato de servicio para autónomos y PYMES.',
}

export default function TerminosPage() {
  return (
    <LegalLayout title="Términos de Servicio">
      <Section title="1. Identificación del servicio">
        <p>
          <strong>Nexo Billing</strong> es una plataforma SaaS de facturación
          electrónica propiedad de <strong>Nexo Digital Unipersonal</strong>, con
          domicilio en Barcelona (España).
        </p>
        <p className="mt-3">
          El servicio permite a autónomos y pequeñas empresas españolas crear,
          gestionar y enviar facturas electrónicas, incluyendo el cumplimiento
          del sistema Verifactu de la AEAT.
        </p>
      </Section>

      <Section title="2. Registro y cuenta">
        <p>
          Para utilizar el servicio es necesario crear una cuenta proporcionando
          datos reales y actualizados. El usuario es responsable de mantener la
          confidencialidad de sus credenciales de acceso.
        </p>
        <p className="mt-3">
          Cada cuenta está asociada a un tenant (empresa). El titular de la
          cuenta (OWNER) puede invitar a otros usuarios con roles de ADMIN o
          ACCOUNTANT.
        </p>
      </Section>

      <Section title="3. Plan y precio">
        <p>
          Nexo Billing opera con un único plan Profesional por un importe de{' '}
          <strong>39€/mes (IVA no incluido)</strong> por tenant.
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Facturas ilimitadas.</li>
          <li>1 contable incluido (rol ACCOUNTANT).</li>
          <li>Sin permanencia mínima.</li>
          <li>Pago mediante domiciliación bancaria SEPA (GoCardless).</li>
        </ul>
      </Section>

      <Section title="4. Responsabilidades del usuario">
        <p>El usuario se compromete a:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            Introducir datos fiscales veraces (NIF, razón social, dirección) en
            la plataforma.
          </li>
          <li>
            Verificar la exactitud de las facturas antes de su emisión y envío a
            la AEAT.
          </li>
          <li>
            No utilizar la plataforma para fines ilícitos o fraudulentos.
          </li>
          <li>
            Cumplir con la normativa de protección de datos respecto a los datos
            de sus propios clientes.
          </li>
        </ul>
      </Section>

      <Section title="5. Disponibilidad y soporte">
        <p>
          Nexo Digital Unipersonal se compromete a mantener la mayor
          disponibilidad posible del servicio, sin garantías expresas de uptime.
          El servicio se presta &ldquo;tal cual&rdquo; (as-is).
        </p>
        <p className="mt-3">
          El soporte técnico se presta por email en{' '}
          <a
            href="mailto:contacto@nexo-digital.app"
            className="text-[var(--accent)] hover:underline"
          >
            contacto@nexo-digital.app
          </a>{' '}
          durante horario laboral (CET/CEST).
        </p>
      </Section>

      <Section title="6. Propiedad intelectual">
        <p>
          Todos los derechos de propiedad intelectual sobre el software, diseño
          y contenido de Nexo Billing pertenecen a Nexo Digital Unipersonal. El
          usuario conserva todos los derechos sobre los datos que introduce en
          la plataforma (facturas, clientes, etc.).
        </p>
      </Section>

      <Section title="7. Rescisión">
        <p>
          El usuario puede cancelar su suscripción en cualquier momento desde
          la sección de configuración de facturación. Tras la cancelación, el
          acceso se mantendrá durante un período de gracia de <strong>7 días</strong>.
        </p>
        <p className="mt-3">
          Nexo Digital Unipacional se reserva el derecho de suspender cuentas
          que incumplan estos términos o utilicen el servicio de forma fraudulenta.
        </p>
      </Section>

      <Section title="8. Ley aplicable y jurisdicción">
        <p>
          Estos términos se rigen por la legislación española. Para cualquier
          controversia derivada del uso del servicio, las partes se someten a
          los juzgados y tribunales de Barcelona (España).
        </p>
      </Section>
    </LegalLayout>
  )
}

function LegalLayout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link href="/" className="text-sm font-medium text-[var(--accent)] hover:underline">
            ← Volver a Nexo Billing
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="[font-family:var(--font-serif)] text-3xl sm:text-4xl text-[var(--text)] mb-10">
          {title}
        </h1>
        <div className="space-y-10 text-sm text-[var(--text-dim)] leading-relaxed">
          {children}
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-8 mt-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center text-xs text-[var(--text-subtle)]">
          © {new Date().getFullYear()} Nexo Digital Unipersonal · Barcelona
        </div>
      </footer>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="text-lg font-medium text-[var(--text)] mb-3">{title}</h2>
      {children}
    </section>
  )
}
