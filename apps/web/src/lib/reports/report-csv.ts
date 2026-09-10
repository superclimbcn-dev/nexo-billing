import JSZip from 'jszip'
import { REPORT_NOTICE, type AccountingReport, type ReportCell } from './report-types'
import { reportDate } from './report-period'

/** BOM, semicolon and decimal comma for Spanish spreadsheet applications. */
export function encodeCsv(rows: ReportCell[][]): string {
  const cell = (value: ReportCell): string => {
    if (value === null) return ''
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new Error('Importe no válido')
      return value.toFixed(2).replace('.', ',')
    }
    const text = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value
    return `"${text.replace(/"/g, '""')}"`
  }
  return '\uFEFF' + rows.map((row) => row.map(cell).join(';')).join('\r\n') + '\r\n'
}

function metadata(report: AccountingReport): ReportCell[][] {
  return [
    ['NEXO BILLING'],
    ['Empresa', report.tenant.name],
    ['Titular', report.tenant.legalName ?? report.tenant.name],
    ['NIF/NIE', report.tenant.nif],
    ['Período', report.period.label],
    ['Generado', reportDate(report.generatedAt)],
    [REPORT_NOTICE],
    ...report.notes.map((note) => [note]),
  ]
}

/** A rectangular CSV that retains every section, with stable section/row identifiers. */
export function reportCsv(report: AccountingReport): string {
  const width = Math.max(2, ...report.tables.map((t) => t.columns.length))
  const rows: ReportCell[][] = [
    ['seccion', 'fila', ...Array.from({ length: width }, (_, i) => `campo_${i + 1}`)],
  ]
  const add = (section: string, type: string, values: ReportCell[]) =>
    rows.push([
      section,
      type,
      ...values,
      ...Array.from({ length: width - values.length }, () => null),
    ])
  metadata(report).forEach((row) => add('informacion', 'dato', row))
  for (const table of report.tables) {
    add(table.key, 'columnas', table.columns)
    if (table.note) add(table.key, 'nota', [table.note])
    table.rows.forEach((row) => add(table.key, 'dato', row))
  }
  return encodeCsv(rows)
}

export async function reportZip(report: AccountingReport): Promise<Uint8Array> {
  const zip = new JSZip()
  zip.file('informacion.csv', encodeCsv(metadata(report)))
  for (const table of report.tables)
    zip.file(`${table.key}.csv`, encodeCsv([table.columns, ...table.rows]))
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
}
