import {
  calculateFiscalPeriod,
  type FiscalExpenseDocument,
} from '@/app/(app)/impuestos/_lib/fiscal-calculation'
import { PAYMENT_METHOD_LABELS } from '@/app/(app)/gastos/_lib/expense-payment'
import { reportDate } from './report-period'
import type { AccountingReport, ReportExpense, ReportMovement, ReportTable } from './report-types'

export const reportStatus = (status: string) =>
  ({
    paid: 'Pagado',
    pending: 'Pendiente',
    sent: 'Emitida',
    partially_paid: 'Pago parcial',
    overdue: 'Vencido',
    cancelled: 'Anulado',
    rectified: 'Rectificada',
    draft: 'Borrador',
  })[status] ?? status
export const reportMethod = (method: string | null) =>
  method && method in PAYMENT_METHOD_LABELS
    ? PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS]
    : (method ?? '')

export function movementTable(key: string, title: string, items: ReportMovement[]): ReportTable {
  return {
    key,
    title,
    columns: [
      'fecha',
      'tipo',
      'cliente_proveedor',
      'descripcion',
      'numero_factura_ticket',
      'importe',
      'metodo_pago',
      'estado',
      'fecha_pago_cobro',
      'criterio_fecha',
    ],
    rows: items.map((item) => [
      reportDate(item.date),
      item.type,
      item.party,
      item.description,
      item.number,
      item.amount,
      reportMethod(item.method),
      reportStatus(item.status),
      reportDate(item.paidAt),
      item.dateBasis,
    ]),
  }
}

/** Per-document deduction amounts come from the unchanged fiscal engine. */
export function expenseDeductions(expense: ReportExpense) {
  const calculation = calculateFiscalPeriod({
    tenantId: expense.tenantId,
    year: expense.issuedAt.getFullYear(),
    quarter: (['Q1', 'Q2', 'Q3', 'Q4'] as const)[Math.floor(expense.issuedAt.getMonth() / 3)]!,
    invoices: [],
    expenses: [{ ...expense, status: expense.status as FiscalExpenseDocument['status'] }],
  })
  return {
    vat: calculation.audit.undefinedFiscalExpenseIds.vat.length
      ? null
      : calculation.modelo303.deductibleVat,
    irpf: calculation.audit.undefinedFiscalExpenseIds.irpf.length
      ? null
      : calculation.modelo130.deductibleExpenses,
    warning: calculation.warnings.map((warning) => warning.message).join(' '),
  }
}

export function buildReportTables(report: AccountingReport): ReportTable[] {
  const tables: ReportTable[] = []
  const { treasury: t } = report
  if (report.kind !== 'tax') {
    tables.push({
      key: 'resumen_financiero',
      title: 'A. Resumen financiero',
      columns: ['concepto', 'importe'],
      rows: [
        ['Saldo inicial (no disponible)', t.openingBalance],
        ['Entradas cobradas', t.totalIn],
        ['Salidas pagadas', t.totalOut],
        ['Saldo del período', t.periodBalance],
        ['Cuentas por cobrar', t.pendingIn],
        ['Cuentas por pagar', t.pendingOut],
      ],
    })
    tables.push(movementTable('movimientos', 'Movimientos realizados', t.movements))
  }
  if (report.kind !== 'treasury') {
    tables.push({
      key: 'resumen_fiscal',
      title: 'B. Resumen fiscal',
      columns: [
        'periodo_fiscal',
        'iva_estimado',
        'irpf_estimado_periodo',
        'irpf_acumulado_antes_ajustes',
      ],
      note: 'El IRPF acumulado no equivale a una cuota trimestral. Los valores sin fuente fiable permanecen vacíos.',
      rows: report.fiscal.map((f) => [
        `${f.period.year} ${f.period.quarter}`,
        f.modelo303.estimatedResult,
        f.modelo130.estimatedPeriodResult,
        f.modelo130.estimateBeforeAdjustments,
      ]),
    })
    for (const f of report.fiscal) {
      const suffix = `${f.period.year}_${f.period.quarter}`
      tables.push({
        key: `modelo_303_${suffix}`,
        title: `H. IVA estimado — Modelo 303 · ${f.period.quarter} ${f.period.year}`,
        columns: ['concepto', 'importe'],
        rows: [
          ['Base imponible ventas', f.modelo303.taxableBase],
          ['IVA repercutido', f.modelo303.outputVat],
          ['IVA soportado', f.modelo303.supportedVat],
          ['IVA deducible', f.modelo303.deductibleVat],
          ['IVA no deducible', f.modelo303.nonDeductibleVat],
          ['Resultado estimado', f.modelo303.estimatedResult],
        ],
      })
      tables.push({
        key: `modelo_130_${suffix}`,
        title: `I. IRPF estimado — Modelo 130 · ${f.period.quarter} ${f.period.year}`,
        columns: ['concepto', 'importe', 'observacion'],
        rows: [
          [
            'Ingresos acumulados',
            f.modelo130.grossIncome,
            'Desde enero hasta el cierre del trimestre',
          ],
          ['Gastos deducibles acumulados', f.modelo130.deductibleExpenses, ''],
          ['Rendimiento neto', f.modelo130.netIncome, ''],
          ['Gastos de difícil justificación', null, 'No implementados en el motor fiscal'],
          [
            'Cuota previa / IRPF acumulado teórico',
            f.modelo130.theoreticalAccruedTax,
            'Antes de ajustes',
          ],
          [
            'Retenciones',
            f.modelo130.withholdings,
            f.modelo130.withholdings === null ? 'Sin fuente fiable' : '',
          ],
          [
            'Pagos anteriores',
            f.modelo130.previousPayments,
            f.modelo130.previousPayments === null ? 'Sin fuente fiable' : '',
          ],
          ['Minoraciones', null, 'No implementadas en el motor fiscal'],
          [
            'Resultado estimado del período',
            f.modelo130.estimatedPeriodResult,
            f.modelo130.estimatedPeriodResult === null ? 'Sin fuente fiable' : '',
          ],
          [
            'Estimación acumulada antes de ajustes',
            f.modelo130.estimateBeforeAdjustments,
            'No es la cuota definitiva del trimestre',
          ],
        ],
      })
      if (f.warnings.length)
        tables.push({
          key: `revision_fiscal_${suffix}`,
          title: `Revisión fiscal · ${f.period.quarter} ${f.period.year}`,
          columns: ['documento', 'modelos', 'aviso'],
          rows: f.warnings.map((w) => [w.documentId, w.models.join(', '), w.message]),
        })
    }
  }
  if (report.kind === 'advisor') {
    tables.push({
      key: 'facturas',
      title: 'C. Facturas emitidas',
      columns: [
        'fecha',
        'numero',
        'cliente',
        'nif',
        'base_imponible',
        'iva',
        'total',
        'estado',
        'fecha_cobro',
        'metodo_pago',
        'fecha_operacion',
      ],
      rows: report.invoices.map((inv) => [
        reportDate(inv.issuedAt),
        inv.fullNumber,
        inv.clientName,
        inv.clientNif,
        inv.subtotal,
        inv.vatAmount,
        inv.totalAmount,
        reportStatus(inv.status),
        inv.payments.map((p) => reportDate(p.paidAt)).join(' | '),
        inv.payments.length
          ? [...new Set(inv.payments.map((p) => reportMethod(p.method)))].join(' | ')
          : reportMethod(inv.paymentMethod),
        reportDate(inv.operationAt),
      ]),
    })
    tables.push({
      key: 'gastos',
      title: 'D. Gastos',
      columns: [
        'fecha',
        'proveedor',
        'nif',
        'categoria',
        'descripcion',
        'numero_factura',
        'base_imponible',
        'iva',
        'iva_deducible',
        'gasto_irpf_deducible',
        'total',
        'estado_pago',
        'fecha_pago',
        'metodo_pago',
        'revision_fiscal',
      ],
      rows: report.expenses.map((exp) => {
        const deductions = expenseDeductions(exp)
        return [
          reportDate(exp.issuedAt),
          exp.vendor,
          exp.nif,
          exp.category,
          exp.description,
          exp.externalNumber,
          exp.subtotal,
          exp.vatAmount,
          deductions.vat,
          deductions.irpf,
          exp.totalAmount,
          reportStatus(exp.status),
          reportDate(exp.paidAt),
          reportMethod(exp.paymentMethod),
          deductions.warning,
        ]
      }),
    })
    tables.push({
      key: 'seguridad_social',
      title: 'E. Cuotas de autónomo / Seguridad Social',
      columns: ['concepto', 'importe', 'observacion'],
      rows: [
        [
          'Cuotas de autónomo / Seguridad Social',
          null,
          'No identificables de forma fiable en los datos actuales. Revisar el detalle de gastos; no se han reclasificado documentos.',
        ],
      ],
    })
  }
  if (report.kind !== 'tax') {
    tables.push(movementTable('cuentas_por_cobrar', 'F. Cuentas por cobrar', t.receivables))
    tables.push(movementTable('cuentas_por_pagar', 'G. Cuentas por pagar', t.payables))
  }
  return tables
}
