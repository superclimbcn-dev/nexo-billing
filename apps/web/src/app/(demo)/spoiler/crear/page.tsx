import {
  AppShell,
  Sidebar,
  TenantSelector,
  NavItem,
  NavSectionLabel,
  ComplianceBadge,
  LineItemRow,
  LineItemsTable,
  InvoiceTotals,
  InvoicePdfPreview,
  FormInput,
  Button,
} from '@nexo/core-ui'
import { tenant, createInvoiceData } from '@/mocks/spoiler-data'

export default function CrearFacturaPage() {
  const { client, invoice, lineItems, totals, pdf } = createInvoiceData

  const sidebar = (
    <Sidebar footer={<ComplianceBadge />}>
      <TenantSelector {...tenant} />
      <NavSectionLabel>Gestión</NavSectionLabel>
      <NavItem icon="⌂" label="Inicio" />
      <NavItem icon="◈" label="Facturas" active />
      <NavItem icon="✎" label="Presupuestos" />
      <NavItem icon="⟲" label="Recurrentes" />
      <NavItem icon="◉" label="Clientes" />
    </Sidebar>
  )

  return (
    <AppShell sidebar={sidebar}>
      <main className="p-10 px-12 max-w-[1400px]">
        {/* Page header */}
        <div className="flex justify-between items-end mb-8 gap-6">
          <div>
            <h1 className="[font-family:var(--font-serif)] text-[52px] font-normal tracking-[-0.02em] leading-none mb-2">
              Nueva <em className="italic text-[var(--text-dim)]">factura</em>
            </h1>
            <div className="text-[var(--text-dim)] text-sm">{createInvoiceData.subtitle}</div>
          </div>
          <div className="flex gap-2.5">
            <Button variant="secondary">Guardar borrador</Button>
            <Button>Emitir y enviar</Button>
          </div>
        </div>

        {/* Create layout: form + preview */}
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 420px' }}>
          {/* Form panel */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-8">

            {/* Cliente section */}
            <div className="mb-7 pb-7 border-b border-[var(--border)]">
              <div className="[font-family:var(--font-mono)] text-[11px] uppercase text-[var(--text-subtle)] tracking-[0.08em] mb-4">
                ◉ Cliente
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <FormInput label="Cliente" defaultValue={client.name} />
                <FormInput
                  label="NIF"
                  defaultValue={client.nif}
                  className="[font-family:var(--font-mono)]"
                />
              </div>
              <FormInput label="Dirección fiscal" defaultValue={client.address} />
            </div>

            {/* Factura section */}
            <div className="mb-7 pb-7 border-b border-[var(--border)]">
              <div className="[font-family:var(--font-mono)] text-[11px] uppercase text-[var(--text-subtle)] tracking-[0.08em] mb-4">
                ◈ Factura
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                <FormInput
                  label="Serie"
                  defaultValue={invoice.serie}
                  className="[font-family:var(--font-mono)]"
                />
                <FormInput
                  label="Número"
                  defaultValue={invoice.numero}
                  className="[font-family:var(--font-mono)]"
                />
                <FormInput label="Fecha" defaultValue={invoice.fecha} />
              </div>
            </div>

            {/* Conceptos section */}
            <div>
              <div className="[font-family:var(--font-mono)] text-[11px] uppercase text-[var(--text-subtle)] tracking-[0.08em] mb-4">
                ☰ Conceptos
              </div>
              <LineItemsTable>
                {lineItems.map((item, i) => (
                  <LineItemRow key={i} {...item} />
                ))}
              </LineItemsTable>
              <InvoiceTotals
                base={totals.base}
                vatLabel={totals.vatLabel}
                vatAmount={totals.vatAmount}
                total={totals.total}
              />
            </div>
          </div>

          {/* PDF Preview */}
          <InvoicePdfPreview {...pdf} />
        </div>
      </main>
    </AppShell>
  )
}
