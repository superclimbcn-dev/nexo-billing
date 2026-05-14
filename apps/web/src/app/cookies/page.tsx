import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Cookies — Nexo Billing',
  description: 'Información sobre el uso de cookies en Nexo Billing.',
}

export default function CookiesPage() {
  return (
    <LegalLayout title="Política de Cookies">
      <Section title="1. ¿Qué son las cookies?">
        <p>
          Las cookies son pequeños archivos de texto que los sitios web
          almacenan en tu navegador para recordar información sobre tu visita.
          En Nexo Billing utilizamos cookies estrictamente necesarias para el
          funcionamiento del servicio.
        </p>
      </Section>

      <Section title="2. Cookies que utilizamos">
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border border-[var(--border)] rounded-lg">
            <thead className="bg-[var(--surface-raised)]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-dim)] uppercase">
                  Cookie
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-dim)] uppercase">
                  Tipo
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-dim)] uppercase">
                  Finalidad
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-dim)] uppercase">
                  Duración
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr>
                <td className="px-4 py-2 font-mono text-xs">sb-access-token</td>
                <td className="px-4 py-2">Necesaria</td>
                <td className="px-4 py-2">
                  Mantener la sesión de usuario activa (autenticación Supabase)
                </td>
                <td className="px-4 py-2">Sesión</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">sb-refresh-token</td>
                <td className="px-4 py-2">Necesaria</td>
                <td className="px-4 py-2">
                  Refrescar la sesión de usuario de forma segura
                </td>
                <td className="px-4 py-2">Sesión</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="3. Cookies de terceros">
        <p>
          Nexo Billing no utiliza cookies de publicidad ni de analítica de
          terceros (Google Analytics, Meta Pixel, etc.). Las únicas cookies
          presentes son las estrictamente necesarias para la autenticación,
          gestionadas por Supabase (nuestro proveedor de autenticación).
        </p>
      </Section>

      <Section title="4. Cómo gestionar las cookies">
        <p>
          Puedes configurar tu navegador para bloquear o eliminar cookies.
          Ten en cuenta que si deshabilitas las cookies de sesión, no podrás
          iniciar sesión en Nexo Billing.
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            <a
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              Google Chrome
            </a>
          </li>
          <li>
            <a
              href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a
              href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              Safari
            </a>
          </li>
        </ul>
      </Section>

      <Section title="5. Más información">
        <p>
          Para cualquier duda sobre el uso de cookies, puedes contactar con
          nosotros en{' '}
          <a
            href="mailto:contacto@nexo-digital.app"
            className="text-[var(--accent)] hover:underline"
          >
            contacto@nexo-digital.app
          </a>
          .
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
