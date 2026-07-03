interface QuoteEmailTemplateProps {
  tenantName: string
  quoteNumber: string
  totalAmount: number
  clientName: string
  publicUrl: string
  validUntil: Date
}

export function QuoteEmailTemplate({
  tenantName,
  quoteNumber,
  totalAmount,
  clientName,
  publicUrl,
  validUntil,
}: QuoteEmailTemplateProps) {
  const totalFormatted = totalAmount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const validUntilFormatted = new Date(validUntil).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        backgroundColor: '#f5f5f5',
        padding: '40px 20px',
        color: '#0a0a0a',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #e5e5e5',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0a0a0b',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: '#d4ff3f',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: '0 0 8px',
            }}
          >
            Presupuesto
          </p>
          <h1
            style={{
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: 700,
              margin: 0,
              fontFamily: "'Lora', Georgia, serif",
            }}
          >
            {quoteNumber}
          </h1>
          <p style={{ color: '#a3a3a3', fontSize: '14px', margin: '8px 0 0' }}>
            {tenantName}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '32px' }}>
          <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0 0 24px' }}>
            Hola <strong>{clientName}</strong>,
          </p>
          <p
            style={{
              fontSize: '15px',
              lineHeight: '1.6',
              margin: '0 0 24px',
              color: '#525252',
            }}
          >
            {tenantName} te ha enviado el presupuesto{' '}
            <strong style={{ color: '#0a0a0a' }}>{quoteNumber}</strong> por un importe de{' '}
            <strong style={{ color: '#0a0a0a' }}>{totalFormatted} €</strong>. Este presupuesto es
            válido hasta el <strong>{validUntilFormatted}</strong>.
          </p>

          {/* CTA */}
          <div style={{ textAlign: 'center', margin: '32px 0' }}>
            <a
              href={publicUrl}
              style={{
                display: 'inline-block',
                backgroundColor: '#d4ff3f',
                color: '#0a0a0b',
                fontSize: '15px',
                fontWeight: 600,
                padding: '14px 32px',
                borderRadius: '10px',
                textDecoration: 'none',
              }}
            >
              Ver presupuesto online
            </a>
          </div>

          <p
            style={{
              fontSize: '13px',
              lineHeight: '1.5',
              color: '#737373',
              margin: '0 0 8px',
              textAlign: 'center',
            }}
          >
            También puedes descargar el PDF adjunto en este email.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: '#fafafa',
            padding: '24px 32px',
            textAlign: 'center',
            borderTop: '1px solid #e5e5e5',
          }}
        >
          <p style={{ fontSize: '12px', color: '#a3a3a3', margin: '0 0 4px' }}>
            Generado con <span style={{ color: '#84cc16', fontWeight: 600 }}>Nexo Billing</span>
          </p>
          <p style={{ fontSize: '11px', color: '#d4d4d4', margin: 0 }}>
            Nexo Billing · Facturación digital
          </p>
        </div>
      </div>
    </div>
  )
}
