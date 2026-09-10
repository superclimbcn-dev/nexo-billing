import { formatCurrency } from '@nexo/core-utils'
import { REPORT_NOTICE, type AccountingReport } from '@/lib/reports/report-types'

export function ReportPreview({ report }: { report: AccountingReport }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--text-dim)]">{REPORT_NOTICE}</p>
      <details className="rounded-lg border border-[var(--border)] p-4 text-sm" open>
        <summary className="cursor-pointer font-medium">
          Alcance del informe · {report.period.label}
        </summary>
        <div className="space-y-2 mt-3 text-[var(--text-dim)]">
          {report.notes.map((note, i) => (
            <p key={i}>{note}</p>
          ))}
        </div>
      </details>
      {report.tables.map((table) => (
        <section
          key={table.key}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <h2 className="text-base font-medium mb-3">{table.title}</h2>
          {table.note && <p className="text-sm text-[var(--text-dim)] mb-3">{table.note}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {table.columns.map((column) => (
                    <th
                      key={column}
                      className="text-left p-2 border-b border-[var(--border)] text-[var(--text-dim)] font-medium whitespace-nowrap"
                    >
                      {column.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className="p-2 align-top whitespace-pre-wrap min-w-24">
                        {cell === null
                          ? 'Sin dato'
                          : typeof cell === 'number'
                            ? formatCurrency(cell)
                            : cell || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!table.rows.length && (
              <p className="text-sm py-3 text-[var(--text-dim)]">
                Sin movimientos para este período.
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
