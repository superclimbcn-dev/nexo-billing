import type { ReportExpense, ReportInvoice, ReportMovement, TreasuryReport } from './report-types'
import type { ReportPeriod } from './report-period'

const cents = (value: number) => Math.round(value * 100)
const sum = (items: ReportMovement[]) =>
  items.reduce((total, item) => total + cents(item.amount), 0) / 100

/** Read-only cash projection. Unknown collection dates remain explicitly unknown. */
export function buildTreasuryReport(
  tenantId: string,
  period: ReportPeriod,
  invoices: ReportInvoice[],
  expenses: ReportExpense[],
  now = new Date(),
): TreasuryReport {
  const movements: ReportMovement[] = []
  const receivables: ReportMovement[] = []
  const payables: ReportMovement[] = []
  const notes = [
    'Saldo inicial: no disponible; el sistema no registra un saldo bancario de apertura.',
    'Pendientes: estado actual de documentos emitidos hasta el final del período, incluidos los de períodos anteriores. No es una reconstrucción histórica de deuda.',
  ]
  const within = (date: Date) => date >= period.start && date <= period.end && date <= now
  for (const invoice of invoices) {
    if (invoice.tenantId !== tenantId || ['draft', 'cancelled'].includes(invoice.status)) continue
    const base = {
      id: invoice.id,
      type: 'Entrada' as const,
      party: invoice.clientName,
      description: invoice.description,
      number: invoice.fullNumber,
      status: invoice.status,
      method: invoice.paymentMethod,
    }
    let recordedCents = 0
    const allRecordedCents = invoice.payments.reduce(
      (total, payment) => total + cents(payment.amount),
      0,
    )
    for (const payment of invoice.payments) {
      if (payment.paidAt > now) continue
      recordedCents += cents(payment.amount)
      if (within(payment.paidAt))
        movements.push({
          ...base,
          date: payment.paidAt,
          paidAt: payment.paidAt,
          amount: payment.amount,
          method: payment.method,
          dateBasis: 'Fecha de cobro registrada',
        })
    }
    const declaredPaid = Math.max(
      cents(invoice.paidAmount),
      invoice.status === 'paid' ? cents(invoice.totalAmount) : 0,
    )
    const undated = Math.max(0, declaredPaid - allRecordedCents) / 100
    const knownPaid = recordedCents + cents(undated)
    if (undated > 0 && within(invoice.issuedAt)) {
      movements.push({
        ...base,
        date: invoice.issuedAt,
        paidAt: null,
        amount: undated,
        dateBasis: 'Fecha de emisión como referencia; fecha de cobro no registrada',
      })
      notes.push(
        `Factura ${invoice.fullNumber}: cobro sin fecha registrada; asignado a la fecha de emisión como referencia, sin modificar el documento.`,
      )
    }
    if (
      ['sent', 'overdue', 'partially_paid'].includes(invoice.status) &&
      invoice.issuedAt <= period.end &&
      invoice.issuedAt <= now
    ) {
      const pending = Math.max(0, cents(invoice.totalAmount) - knownPaid) / 100
      if (pending > 0)
        receivables.push({
          ...base,
          date: invoice.issuedAt,
          paidAt: null,
          amount: pending,
          dateBasis: 'Fecha de emisión',
        })
    }
  }
  for (const expense of expenses) {
    if (expense.tenantId !== tenantId) continue
    const base = {
      id: expense.id,
      type: 'Salida' as const,
      party: expense.vendor,
      description: expense.description,
      number: expense.externalNumber ?? '',
      amount: expense.totalAmount,
      method: expense.paymentMethod,
      status: expense.status,
    }
    if (expense.status === 'paid' && expense.paidAt && within(expense.paidAt)) {
      movements.push({
        ...base,
        date: expense.paidAt,
        paidAt: expense.paidAt,
        dateBasis: 'Fecha de pago registrada',
      })
    }
    if (expense.status === 'paid' && !expense.paidAt && within(expense.issuedAt)) {
      notes.push(
        `Gasto ${expense.externalNumber || expense.id}: pagado sin fecha de pago; no se puede asignar al flujo de caja del período.`,
      )
    }
    if (expense.status === 'pending' && expense.issuedAt <= period.end && expense.issuedAt <= now) {
      payables.push({
        ...base,
        date: expense.issuedAt,
        paidAt: null,
        dateBasis: 'Fecha del documento',
      })
    }
  }
  movements.sort((a, b) => a.date.getTime() - b.date.getTime())
  const totalIn = sum(movements.filter((item) => item.type === 'Entrada'))
  const totalOut = sum(movements.filter((item) => item.type === 'Salida'))
  return {
    openingBalance: null,
    totalIn,
    totalOut,
    periodBalance: (cents(totalIn) - cents(totalOut)) / 100,
    pendingIn: sum(receivables),
    pendingOut: sum(payables),
    movements,
    receivables,
    payables,
    notes,
  }
}
