import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Nexo Billing',
  description: 'Política de privacidad de Nexo Billing. Cumplimiento con el RGPD y la normativa española de protección de datos.',
}

export default function PrivacidadPage() {
  return (
    <LegalLayout title="Política de Privacidad">
      <Section title="1. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de los datos personales es{' '}
          <strong>Nexo Digital Unipersonal</strong>, con domicilio social en
          Barcelona (España) y NIF/CIF correspondiente a la inscripción en el
          Registro Mercantil de Barcelona.
        </p>
        <p className="mt-3">
          Puedes contactar con nosotros en:{' '}
          <a
            href="mailto:contacto@nexo-digital.app"
            className="text-[var(--accent)] hover:underline"
          >
            contacto@nexo-digital.app
          </a>
        </p>
      </Section>

      <Section title="2. Datos que recopilamos">
        <p>Tratamos los siguientes datos personales:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            <strong>Datos fiscales:</strong> NIF/CIF, razón social, dirección
            fiscal, CNAE (necesarios para la emisión de facturas conforme a la
            normativa tributaria española).
          </li>
          <li>
            <strong>Datos de contacto:</strong> nombre, email, teléfono del
            titular del negocio y de sus clientes (introducidos por el usuario).
          </li>
          <li>
            <strong>Datos bancarios:</strong> IBAN (opcional, para facilitar el
            pago de facturas).
          </li>
          <li>
            <strong>Datos de uso:</strong> registros de actividad dentro de la
            plataforma (audit logs) para garantizar la seguridad del servicio.
          </li>
        </ul>
      </Section>

      <Section title="3. Finalidad del tratamiento">
        <p>Los datos se tratan con las siguientes finalidades:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            Gestionar la facturación electrónica y el cumplimiento de
            obligaciones tributarias (incluido Verifactu).
          </li>
          <li>
            Enviar facturas por email a los clientes del usuario (sobre la base
            de la ejecución del contrato de servicio).
          </li>
          <li>
            Cumplir con obligaciones legales aplicables a Nexo Digital
            Unipersonal como prestador del servicio.
          </li>
        </ul>
      </Section>

      <Section title="4. Base jurídica">
        <p>
          La base jurídica para el tratamiento de datos es la{' '}
          <strong>ejecución de un contrato</strong> (art. 6.1.b RGPD) y el{' '}
          <strong>cumplimiento de obligaciones legales</strong> (art. 6.1.c RGPD),
          especialmente la normativa tributaria española (Ley 58/2003, General
          Tributaria) y el Reglamento Verifactu.
        </p>
      </Section>

      <Section title="5. Conservación de datos">
        <p>
          Los datos se conservarán durante la vigencia de la relación contractual
          y, posteriormente, el tiempo necesario para cumplir con obligaciones
          legales. Conforme a la normativa tributaria española, los libros
          registros de facturación deben conservarse durante{' '}
          <strong>6 años</strong>.
        </p>
      </Section>

      <Section title="6. Destinatarios de los datos">
        <p>Los datos podrán ser comunicados a:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            <strong>AEAT (Agencia Tributaria):</strong> en el marco del sistema
            Verifactu, conforme a la normativa vigente.
          </li>
          <li>
            <strong>Hacienda Foral:</strong> en caso de facturación en territorios
            con régimen foral.
          </li>
          <li>
            <strong>Proveedores de servicios cloud:</strong> Supabase (alojamiento
            de base de datos, UE), Vercel (alojamiento de aplicación, UE).
          </li>
        </ul>
      </Section>

      <Section title="7. Derechos del interesado">
        <p>Puedes ejercer los siguientes derechos:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Derecho de acceso a tus datos personales.</li>
          <li>Derecho de rectificación de datos inexactos.</li>
          <li>Derecho de supresión (limitado por obligaciones legales fiscales).</li>
          <li>Derecho de limitación del tratamiento.</li>
          <li>Derecho de oposición.</li>
          <li>Derecho a la portabilidad de datos.</li>
        </ul>
        <p className="mt-3">
          Para ejercer estos derechos, escribe a{' '}
          <a
            href="mailto:contacto@nexo-digital.app"
            className="text-[var(--accent)] hover:underline"
          >
            contacto@nexo-digital.app
          </a>{' '}
          indicando el derecho que deseas ejercer y adjuntando copia de tu DNI.
        </p>
      </Section>

      <Section title="8. Medidas de seguridad">
        <p>
          Nexo Billing implementa las siguientes medidas de seguridad para
          proteger tus datos:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            <strong>Cifrado en tránsito:</strong> TLS 1.3 en todas las
            comunicaciones entre cliente y servidor.
          </li>
          <li>
            <strong>Cifrado en reposo:</strong> Base de datos alojada en Supabase
            con cifrado AES-256.
          </li>
          <li>
            <strong>Cifrado de secretos:</strong> API keys y contraseñas SMTP se
            almacenan cifradas con AES-256-GCM.
          </li>
          <li>
            <strong>Backups automáticos:</strong> copias de seguridad diarias de
            la base de datos.
          </li>
          <li>
            <strong>Autenticación segura:</strong> gestión de sesiones mediante
            Supabase Auth con tokens JWT.
          </li>
        </ul>
      </Section>
    </LegalLayout>
  )
}

// ── Shared components ───────────────────────────────────────────────────────

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
