import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import {
  REPORT_FOOTER,
  REPORT_NOTICE,
  type AccountingReport,
  type ReportCell,
  type ReportTable,
} from './report-types'
import { reportDate } from './report-period'

const styles = StyleSheet.create({
  page: {
    paddingTop: 132,
    paddingBottom: 45,
    paddingHorizontal: 32,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#17232e',
  },
  header: { position: 'absolute', top: 24, left: 32, right: 32 },
  brand: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: '#173d36', marginBottom: 5 },
  company: { fontSize: 11, marginBottom: 3 },
  meta: { fontSize: 8, color: '#53636b', marginBottom: 3 },
  title: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 8, marginBottom: 5 },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#dce3e6' },
  column: { padding: 5, flexShrink: 0 },
  columnHeader: { backgroundColor: '#e9f0ed', fontFamily: 'Helvetica-Bold', color: '#173d36' },
  note: { marginBottom: 7, lineHeight: 1.4, color: '#53636b' },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#53636b',
  },
})

export function pdfColumnGroups(table: ReportTable): number[][] {
  if (table.columns.length <= 5) return [table.columns.map((_, i) => i)]
  const groups: number[][] = []
  for (let start = 2; start < table.columns.length; start += 3) {
    groups.push([
      0,
      1,
      ...Array.from({ length: Math.min(3, table.columns.length - start) }, (_, i) => start + i),
    ])
  }
  return groups
}
const cellText = (cell: ReportCell) =>
  cell === null
    ? 'Sin dato'
    : typeof cell === 'number'
      ? cell.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : cell || '—'

export function ReportPdfDocument({ report }: { report: AccountingReport }) {
  const name = {
    treasury: 'Informe de tesorería',
    tax: 'Informe fiscal',
    advisor: 'Informe para gestor',
  }[report.kind]
  const header = (title: string) => (
    <View style={styles.header} fixed>
      <Text style={styles.brand}>NEXO BILLING</Text>
      <Text style={styles.company}>{report.tenant.name}</Text>
      <Text style={styles.meta}>
        Titular: {report.tenant.legalName ?? report.tenant.name} · NIF/NIE: {report.tenant.nif}
      </Text>
      <Text style={styles.meta}>
        Período: {report.period.label} · Generado: {reportDate(report.generatedAt)} · Importes en
        EUR
      </Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  )
  const footer = (
    <View style={styles.footer} fixed>
      <Text>{REPORT_FOOTER}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )
  return (
    <Document title={`${name} · ${report.period.label}`} author="Nexo Billing" language="es-ES">
      <Page size="A4" orientation="landscape" style={styles.page}>
        {header(name)}
        <Text style={styles.note}>{REPORT_NOTICE}</Text>
        {report.notes.map((note, i) => (
          <Text key={i} style={styles.note}>
            {note}
          </Text>
        ))}
        <Text style={styles.note}>
          Las tablas extensas continúan por páginas y bloques de columnas. La referencia «Fila»
          identifica el mismo registro en cada bloque. «Sin dato» no equivale a cero.
        </Text>
        {footer}
      </Page>
      {report.tables.flatMap((table) =>
        pdfColumnGroups(table).map((columns, group, groups) => {
          const weights = columns.map((index) =>
            ['descripcion', 'observacion', 'criterio_fecha', 'aviso'].includes(
              table.columns[index]!,
            )
              ? 3
              : table.columns[index] === 'concepto'
                ? 2
                : 1,
          )
          const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
          const width = (index: number) =>
            `${(94 * weights[columns.indexOf(index)]!) / totalWeight}%`
          return (
            <Page
              key={`${table.key}-${group}`}
              size="A4"
              orientation="landscape"
              style={{ ...styles.page, paddingTop: 175 }}
            >
              {header(
                `${table.title}${groups.length > 1 ? ` · Bloque ${group + 1}/${groups.length}` : ''}`,
              )}
              <View
                fixed
                style={{
                  position: 'absolute',
                  left: 32,
                  right: 32,
                  top: 124,
                  ...styles.row,
                  ...styles.columnHeader,
                }}
              >
                <Text style={{ ...styles.column, width: '6%' }}>Fila</Text>
                {columns.map((index) => (
                  <Text key={index} style={{ ...styles.column, width: width(index) }}>
                    {table.columns[index]!.replace(/_/g, ' ')}
                  </Text>
                ))}
              </View>
              {table.note && <Text style={styles.note}>{table.note}</Text>}
              {table.rows.length === 0 && (
                <Text style={styles.note}>Sin movimientos para este período.</Text>
              )}
              {table.rows.map((row, index) => (
                <View
                  key={index}
                  style={styles.row}
                  wrap={columns.some((column) => String(row[column] ?? '').length > 1000)}
                >
                  <Text style={{ ...styles.column, width: '6%' }}>{index + 1}</Text>
                  {columns.map((column) => (
                    <Text key={column} style={{ ...styles.column, width: width(column) }}>
                      {cellText(row[column] ?? null)}
                    </Text>
                  ))}
                </View>
              ))}
              {footer}
            </Page>
          )
        }),
      )}
    </Document>
  )
}
