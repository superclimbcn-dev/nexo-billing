import Link from 'next/link'
import { getAccountingReport } from '@/lib/reports/report-data'
import { defaultReportRequest, reportRequestSchema } from '@/lib/reports/report-period'
import { ReportControls } from './_components/report-controls'
import { ReportPreview } from './_components/report-preview'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const parsed = reportRequestSchema.safeParse({
    ...defaultReportRequest('advisor'),
    ...params,
    report: 'advisor',
    format: 'pdf',
  })
  if (!parsed.success)
    return (
      <p role="alert">
        Período no válido.{' '}
        <Link href="/informes" className="underline">
          Volver al informe para gestor
        </Link>
      </p>
    )
  const report = await getAccountingReport(parsed.data)
  return (
    <div className="max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl [font-family:var(--font-serif)]">Informe para gestor</h1>
        <p className="text-sm mt-1 text-[var(--text-dim)]">
          {report.tenant.name} · {report.period.label}
        </p>
      </header>
      <ReportControls key={JSON.stringify(parsed.data)} request={parsed.data} />
      <ReportPreview report={report} />
    </div>
  )
}
