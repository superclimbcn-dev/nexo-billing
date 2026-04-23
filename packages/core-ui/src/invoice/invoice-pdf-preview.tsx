import { cn } from '../primitives/cn'

export interface PdfParty {
  label: string
  name: string
  detail: string
}

export interface PdfLineItem {
  description: string
  qty: string
  price: string
  total: string
}

export interface PdfTotals {
  base: string
  vatLabel: string
  vatAmount: string
  total: string
}

export interface InvoicePdfPreviewProps {
  invoiceNumber: string
  issuer: { name: string; nameItalic?: string }
  from: PdfParty
  to: PdfParty
  lineItems: PdfLineItem[]
  totals: PdfTotals
  className?: string
}

export function InvoicePdfPreview({
  invoiceNumber,
  issuer,
  from,
  to,
  lineItems,
  totals,
  className,
}: InvoicePdfPreviewProps) {
  return (
    <div
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[16px] overflow-hidden',
        'sticky top-[100px] self-start',
        className
      )}
    >
      <div className="px-5 py-4 bg-[var(--surface-raised)] border-b border-[var(--border)] flex justify-between items-center">
        <div className="text-xs [font-family:var(--font-mono)] text-[var(--text-subtle)] uppercase tracking-[0.06em]">
          📄 Vista previa · PDF
        </div>
        <div className="text-[11px] text-[var(--text-subtle)] [font-family:var(--font-mono)]">
          en tiempo real
        </div>
      </div>
      <div className="bg-white text-[#1a1a1a] p-8 m-5 rounded-[8px] text-[11px] min-h-[480px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative">
        {/* Brand header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-[#1a1a1a]">
          <h2 className="[font-family:var(--font-serif)] text-[22px] font-normal tracking-[-0.02em]">
            {issuer.name} {issuer.nameItalic && <em className="italic text-[#666]">{issuer.nameItalic}</em>}
          </h2>
          <div className="[font-family:var(--font-mono)] text-[10px] text-[#666] uppercase text-right">
            <div>FACTURA</div>
            <div className="[font-family:var(--font-serif)] text-base text-[#1a1a1a] tracking-[-0.01em] mt-0.5">
              {invoiceNumber}
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          {[from, to].map((party) => (
            <div key={party.label}>
              <div className="[font-family:var(--font-mono)] text-[9px] text-[#999] uppercase tracking-[0.08em] mb-1">
                {party.label}
              </div>
              <div className="font-semibold text-[11px]">{party.name}</div>
              <div
                className="text-[#666] text-[10px] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: party.detail.replace(/\n/g, '<br/>') }}
              />
            </div>
          ))}
        </div>

        {/* Table */}
        <table className="w-full border-collapse mb-5">
          <thead>
            <tr>
              {['Concepto', 'Uds.', 'Precio', 'Total'].map((h) => (
                <th
                  key={h}
                  className="text-left py-2 px-1.5 [font-family:var(--font-mono)] text-[8px] font-medium uppercase text-[#999] tracking-[0.06em] border-b border-[#e5e5e5]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, i) => (
              <tr key={i}>
                <td className="py-2.5 px-1.5 text-[10px] border-b border-[#f0f0f0]">{item.description}</td>
                <td className="py-2.5 px-1.5 text-[10px] border-b border-[#f0f0f0] text-right">{item.qty}</td>
                <td className="py-2.5 px-1.5 text-[10px] border-b border-[#f0f0f0] text-right">{item.price}</td>
                <td className="py-2.5 px-1.5 text-[10px] border-b border-[#f0f0f0] text-right">{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto w-1/2 pt-2">
          <div className="flex justify-between py-1 text-[10px] text-[#666]">
            <span>Base</span><span>{totals.base}</span>
          </div>
          <div className="flex justify-between py-1 text-[10px] text-[#666]">
            <span>{totals.vatLabel}</span><span>{totals.vatAmount}</span>
          </div>
          <div className="flex justify-between items-baseline border-t-2 border-[#1a1a1a] mt-1.5 pt-2 [font-family:var(--font-serif)] text-base text-[#1a1a1a]">
            <span>Total</span><span>{totals.total}</span>
          </div>
        </div>

        {/* Footer with QR */}
        <div className="mt-6 pt-4 border-t border-[#e5e5e5] flex justify-between items-center gap-4">
          <div
            className="w-[72px] h-[72px] border-4 border-[#000] flex-shrink-0"
            style={{
              background: `
                linear-gradient(45deg, #000 25%, transparent 25%),
                linear-gradient(-45deg, #000 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #000 75%),
                linear-gradient(-45deg, transparent 75%, #000 75%)`,
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
            }}
            aria-label="Código QR de verificación AEAT"
          />
          <div className="text-[8px] text-[#666] leading-relaxed">
            <strong className="text-[#1a1a1a] [font-family:var(--font-mono)] text-[9px] tracking-[0.04em]">
              VERI·FACTU
            </strong>
            <br />
            Factura verificable en la sede electrónica de la AEAT.
            <br />
            Escanea el código QR para verificar.
          </div>
        </div>
      </div>
    </div>
  )
}
