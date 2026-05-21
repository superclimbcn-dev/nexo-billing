import { formatCurrency, formatDate } from '@nexo/core-utils'
import { getAvailableTaxYears, getCurrentQuarter, type Quarter } from './_lib/impuestos-schema'
import type { Vencimiento } from './_lib/impuestos-actions'
import { getImpuestosPageData } from './_lib/impuestos-actions'

export default async function ImpuestosPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; quarter?: string }>
}) {
  const params = await searchParams
  const { year: defaultYear, quarter: defaultQuarter } = getCurrentQuarter()

  const year = params.year ? parseInt(params.year, 10) : defaultYear
  const quarter = (params.quarter as Quarter) || defaultQuarter

  const { m303, m130, vencimientos } = await getImpuestosPageData(year, quarter)

  const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4']
  const availableYears = getAvailableTaxYears(defaultYear)

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="[font-family:var(--font-serif)] text-3xl text-[var(--text)]">
            Impuestos
          </h1>
          <p className="text-sm text-[var(--text-dim)] mt-1">
            Modelo 303 (IVA) y Modelo 130 (IRPF)
          </p>
        </div>

        {/* Filters */}
        <form className="flex gap-3">
          <select
            name="year"
            defaultValue={year}
            className="px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            name="quarter"
            defaultValue={quarter}
            className="px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-md text-sm"
          >
            {quarters.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] text-sm font-medium rounded-md hover:bg-[var(--accent-dim)] transition-colors"
          >
            Ver
          </button>
        </form>
      </header>

      {/* Vencimientos */}
      <section className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide mb-4">
          Próximos vencimientos
        </h2>
        <div className="space-y-2">
          {vencimientos.slice(0, 6).map((v) => (
            <VencimientoRow key={`${v.model}-${v.year}-${v.quarter}`} v={v} />
          ))}
        </div>
      </section>

      {/* Modelo 303 */}
      <section className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide">
            Modelo 303 — IVA Trimestral
          </h2>
          <StatusBadge status={m303.status} deadline={m303.deadline} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <TaxRow label="Base imponible" value={m303.baseImponible} />
            <TaxRow
              label="IVA repercutido"
              value={m303.ivaRepercutido}
              detail="21% sobre facturas emitidas"
            />
            <TaxRow
              label="IVA soportado"
              value={m303.ivaSoportado}
              detail="IVA en gastos y compras"
            />
            <div className="border-t border-[var(--border)] pt-3">
              <TaxRow
                label="A pagar / devolver"
                value={m303.ivaAPagar}
                highlight={m303.ivaAPagar > 0 ? 'danger' : 'success'}
              />
            </div>
          </div>

          <div className="p-4 bg-[var(--surface-raised)] rounded-lg">
            <p className="text-xs text-[var(--text-dim)] uppercase tracking-wide mb-2">
              Resumen
            </p>
            <p className="text-sm text-[var(--text)]">
              {m303.ivaAPagar > 0
                ? `Tienes que pagar ${formatCurrency(m303.ivaAPagar)} de IVA por el trimestre ${m303.quarter} ${m303.year}.`
                : `Te corresponde una devolución de ${formatCurrency(Math.abs(m303.ivaAPagar))} de IVA.`}
            </p>
            <p className="text-xs text-[var(--text-dim)] mt-2">
              Vencimiento: {formatDate(m303.deadline)}
            </p>
          </div>
        </div>
      </section>

      {/* Modelo 130 */}
      <section className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[var(--text-dim)] uppercase tracking-wide">
            Modelo 130 — IRPF Autónomos
          </h2>
          <StatusBadge status={m130.status} deadline={m130.deadline} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <TaxRow label="Rendimiento bruto" value={m130.rendimientoBruto} />
            <TaxRow label="Gastos deducibles" value={m130.gastosDeducibles} />
            <TaxRow label="Rendimiento neto" value={m130.rendimientoNeto} />
            <TaxRow label="IRPF (20%)" value={m130.irpfAPagar} />
            <TaxRow label="Retenciones" value={m130.retenciones} detail="Por profesionales" />
            <div className="border-t border-[var(--border)] pt-3">
              <TaxRow
                label="A pagar"
                value={m130.totalAPagar}
                highlight={m130.totalAPagar > 0 ? 'danger' : 'success'}
              />
            </div>
          </div>

          <div className="p-4 bg-[var(--surface-raised)] rounded-lg">
            <p className="text-xs text-[var(--text-dim)] uppercase tracking-wide mb-2">
              Resumen
            </p>
            <p className="text-sm text-[var(--text)]">
              {m130.totalAPagar > 0
                ? `Tienes que pagar ${formatCurrency(m130.totalAPagar)} de IRPF por el trimestre ${m130.quarter} ${m130.year}.`
                : 'No tienes pago de IRPF pendiente para este trimestre.'}
            </p>
            <p className="text-xs text-[var(--text-dim)] mt-2">
              Vencimiento: {formatDate(m130.deadline)}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function VencimientoRow({ v }: { v: Vencimiento }) {
  const isOverdue = v.status === 'overdue'
  const isModel303 = v.model === '303'

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-md ${
        isOverdue
          ? 'bg-[var(--danger)]/10 border border-[var(--danger)]/30'
          : 'bg-[var(--surface-raised)]'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded ${
            isModel303
              ? 'bg-blue-500/10 text-blue-500'
              : 'bg-purple-500/10 text-purple-500'
          }`}
        >
          {v.model}
        </span>
        <div>
          <p className="text-sm text-[var(--text)]">{v.label}</p>
          <p className="text-xs text-[var(--text-dim)]">
            {formatDate(v.date)}
            {isOverdue && ' · VENCIDO'}
          </p>
        </div>
      </div>
      <p
        className={`text-sm font-mono font-medium ${
          isOverdue ? 'text-[var(--danger)]' : 'text-[var(--text)]'
        }`}
      >
        {formatCurrency(v.estimatedAmount)}
      </p>
    </div>
  )
}

function TaxRow({
  label,
  value,
  detail,
  highlight,
}: {
  label: string
  value: number
  detail?: string
  highlight?: 'danger' | 'success'
}) {
  const colorClass =
    highlight === 'danger'
      ? 'text-[var(--danger)]'
      : highlight === 'success'
        ? 'text-[var(--success)]'
        : 'text-[var(--text)]'

  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm text-[var(--text-dim)]">{label}</span>
        {detail && <span className="text-xs text-[var(--text-subtle)] ml-2">({detail})</span>}
      </div>
      <span className={`text-sm font-mono font-medium ${colorClass}`}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}

function StatusBadge({ status, deadline }: { status: string; deadline: Date }) {
  const isOverdue = status === 'overdue'
  const isPending = status === 'pending'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
        isOverdue
          ? 'bg-[var(--danger)]/10 text-[var(--danger)]'
          : isPending
            ? 'bg-[var(--warning)]/10 text-[var(--warning)]'
            : 'bg-[var(--success)]/10 text-[var(--success)]'
      }`}
    >
      {isOverdue ? 'VENCIDO' : isPending ? 'PENDIENTE' : 'PRESENTADO'}
      {' · '}
      {formatDate(deadline)}
    </span>
  )
}
