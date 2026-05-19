import type { Metadata } from 'next'
import { MarketingNav } from '@/components/marketing-nav'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes — Nexo Billing',
  description: 'Resolvemos tus dudas sobre Verifactu, facturación electrónica y cómo funciona Nexo Billing.',
  alternates: { canonical: '/faq' },
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-[var(--bg)] border border-[var(--border)] rounded-lg open:border-[var(--border-strong)] transition-colors">
      <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-medium text-[var(--text)] select-none">
        {question}
        <span className="text-[var(--text-dim)] group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <p className="px-4 pb-4 text-sm text-[var(--text-dim)] leading-relaxed">{answer}</p>
    </details>
  )
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <MarketingNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h1 className="[font-family:var(--font-serif)] text-4xl sm:text-5xl text-[var(--text)]">
            Preguntas <span className="italic text-[var(--accent)]">frecuentes</span>
          </h1>
          <p className="mt-4 text-[var(--text-dim)]">Respuestas a las dudas más comunes sobre Nexo Billing.</p>
        </div>

        <div className="space-y-4">
          <FaqItem
            question="¿Es obligatorio Verifactu?"
            answer="Sí. A partir de 2027 todos los empresarios y profesionales españoles deben enviar sus facturas a la AEAT en tiempo real. Las sociedades tienen obligación desde enero de 2027 y los autónomos desde julio de 2027. Nexo Billing cumple con el reglamento desde el primer día."
          />
          <FaqItem
            question="¿Qué diferencia hay entre Verifactu y la factura electrónica B2B?"
            answer="Verifactu es el sistema de envío de registros de facturación a la AEAT en tiempo real, obligatorio para todos. La factura electrónica B2B (Ley Crea y Crece) es la obligación de intercambiar facturas electrónicas entre empresas a través de plataformas como Peppol. Nexo Billing cumple con ambas."
          />
          <FaqItem
            question="¿Puedo exportar datos para mi contable?"
            answer="Sí. Puedes descargar un ZIP con todos tus documentos fiscales (facturas, rectificativas, gastos) listo para entregar a tu asesoría. También puedes invitar a tu contable al equipo con un rol específico que le permite ver los documentos pero no modificar la configuración fiscal."
          />
          <FaqItem
            question="¿Qué pasa si no tengo IBAN configurado?"
            answer="El link público de la factura mostrará un mensaje pidiendo al cliente que consulte los datos bancarios contigo directamente. Configura tu IBAN en Ajustes > Empresa para que aparezca automáticamente en todas las facturas."
          />
          <FaqItem
            question="¿Hay app móvil?"
            answer="Nexo Billing es una PWA (Progressive Web App). Puedes instalarla en tu móvil Android o iPhone desde el navegador (Safari en iOS, Chrome en Android) y funciona como una app nativa, incluso con acceso rápido desde la pantalla de inicio."
          />
          <FaqItem
            question="¿Puedo cancelar en cualquier momento?"
            answer="Sí. No hay permanencia mínima ni penalización por cancelación. Si cancelas, mantienes acceso durante 7 días adicionales (período de gracia) para descargar todos tus datos antes de que la cuenta se desactive."
          />
          <FaqItem
            question="¿Cómo funciona el pago?"
            answer="El pago se realiza mediante domiciliación bancaria SEPA a través de GoCardless, una plataforma de pagos regulada en la UE. Una vez al mes se carga el importe de tu cuenta bancaria. Puedes cancelar la domiciliación desde tu banco en cualquier momento."
          />
          <FaqItem
            question="¿Puedo emitir facturas rectificativas?"
            answer="Sí. Nexo Billing genera facturas rectificativas de tipo R1 a R5 según el motivo de rectificación. Las facturas emitidas nunca se modifican ni eliminan — la corrección siempre se hace mediante un documento rectificativo, tal como exige la normativa Verifactu."
          />
          <FaqItem
            question="¿Es segura mi información fiscal?"
            answer="Sí. Los datos se almacenan en servidores de Supabase (Postgres) ubicados en la Unión Europea, con cifrado en tránsito (TLS) y en reposo. Cada empresa tiene un espacio aislado (tenant) con control de acceso por filas (RLS), lo que garantiza que ningún otro cliente puede acceder a tus datos."
          />
          <FaqItem
            question="¿Puedo usar Nexo Billing si soy sociedad (SL, SA)?"
            answer="Sí. Nexo Billing es compatible con autónomos y sociedades. Para sociedades, el campo NIF acepta CIF y se genera la documentación correcta para personas jurídicas. La obligación Verifactu para sociedades comienza en enero 2027."
          />
        </div>

        <div className="mt-16 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-center">
          <p className="text-sm text-[var(--text-dim)]">¿No encuentras lo que buscas?</p>
          <a
            href="mailto:contacto@nexo-digital.app"
            className="mt-2 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Escríbenos a contacto@nexo-digital.app →
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
