import {
  AppShell,
  Sidebar,
  TenantSelector,
  NavItem,
  NavSectionLabel,
  ComplianceBadge,
  KpiCard,
  Panel,
  InvoiceRow,
  WhatsappPromoCard,
  Button,
} from '@nexo/core-ui'
import { tenant, dashboardKpis, recentInvoices } from '@/mocks/spoiler-data'

export default function DashboardPage() {
  const sidebar = (
    <Sidebar footer={<ComplianceBadge />}>
      <TenantSelector {...tenant} />
      <NavSectionLabel>Gestión</NavSectionLabel>
      <NavItem icon="⌂" label="Inicio" active />
      <NavItem icon="◈" label="Facturas" badge={3} />
      <NavItem icon="✎" label="Presupuestos" />
      <NavItem icon="⟲" label="Recurrentes" />
      <NavItem icon="◉" label="Clientes" />
      <NavItem icon="▤" label="Gastos" />
      <NavSectionLabel>Limpieza</NavSectionLabel>
      <NavItem icon="◐" label="Contratos" />
      <NavItem icon="☰" label="Servicios" />
      <NavItem icon="◎" label="Rutas" />
      <NavSectionLabel>Finanzas</NavSectionLabel>
      <NavItem icon="▨" label="Tesorería" />
      <NavItem icon="⌘" label="Impuestos" />
    </Sidebar>
  )

  return (
    <AppShell sidebar={sidebar}>
      <main className="p-10 px-12 max-w-[1400px]">
        {/* Page header */}
        <div className="flex justify-between items-end mb-8 gap-6">
          <div>
            <h1 className="[font-family:var(--font-serif)] text-[52px] font-normal tracking-[-0.02em] leading-none mb-2">
              Buenos días, <em className="italic text-[var(--text-dim)]">Elias</em>
            </h1>
            <div className="text-[var(--text-dim)] text-sm">
              Tu facturación en abril · 22 de abril de 2026
            </div>
          </div>
          <div className="flex gap-2.5">
            <Button variant="secondary">Importar CSV</Button>
            <Button>+ Nueva factura</Button>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {dashboardKpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              unit={kpi.unit}
              delta={kpi.delta}
              deltaVariant={kpi.deltaVariant}
              featured={kpi.featured ?? false}
              sparkPath={kpi.sparkPath}
            />
          ))}
        </div>

        {/* Two column layout */}
        <div className="grid gap-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
          {/* Invoices panel */}
          <Panel
            title="◈ Facturas recientes"
            headerRight={
              <a className="text-xs text-[var(--accent)] no-underline font-medium">Ver todas →</a>
            }
          >
            {recentInvoices.map((inv) => (
              <InvoiceRow key={inv.number} {...inv} />
            ))}
          </Panel>

          {/* Right column */}
          <div>
            <WhatsappPromoCard
              title={<>Factura por <em>WhatsApp</em></>}
              description='"Factura 850€ a Hotel Gracia por limpieza del sábado" · y listo.'
            />

            <Panel title="⚡ Acciones rápidas">
              <div className="px-6 py-5 border-b border-[var(--border)]">
                {[
                  { icon: '📄', title: 'Escanear ticket', desc: 'OCR automático · IVA detectado' },
                  { icon: '↻', title: 'Emitir recurrentes', desc: '8 contratos pendientes este mes' },
                  { icon: '◉', title: 'Recordar cobros', desc: '3 facturas vencidas · enviar email' },
                ].map((action) => (
                  <div
                    key={action.title}
                    className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-colors duration-100 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="w-9 h-9 bg-[var(--surface-raised)] rounded-[10px] grid place-items-center flex-shrink-0">
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-medium">{action.title}</div>
                      <div className="text-[11px] text-[var(--text-subtle)]">{action.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-5">
                <div className="text-[13px] font-semibold mb-1">Próximo vencimiento fiscal</div>
                <div className="text-xs text-[var(--text-dim)] mb-2">Modelo 303 · trimestral</div>
                <div className="flex items-baseline gap-2 mt-2">
                  <div className="[font-family:var(--font-serif)] text-[32px] leading-none">20</div>
                  <div className="text-[13px] text-[var(--text-dim)]">abril · en 2 días</div>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
