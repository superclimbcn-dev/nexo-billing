import { NextRequest, NextResponse } from 'next/server'
import { createElement, type ReactElement } from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { getAccountingReport, ReportAccessError } from '@/lib/reports/report-data'
import { reportRequestSchema, dateInput } from '@/lib/reports/report-period'
import { reportCsv, reportZip } from '@/lib/reports/report-csv'
import { ReportPdfDocument } from '@/lib/reports/report-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  Vary: 'Cookie',
  'X-Content-Type-Options': 'nosniff',
}

export async function GET(request: NextRequest) {
  const parsed = reportRequestSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Selecciona un período y formato válidos' },
      { status: 400, headers: privateHeaders },
    )
  try {
    const report = await getAccountingReport(parsed.data)
    const format = parsed.data.format
    const body =
      format === 'pdf'
        ? new Uint8Array(
            await renderToBuffer(
              createElement(ReportPdfDocument, { report }) as ReactElement<DocumentProps>,
            ),
          )
        : format === 'zip'
          ? await reportZip(report)
          : new TextEncoder().encode(reportCsv(report))
    const filename = `nexo_${parsed.data.report}_${dateInput(report.period.start)}_${dateInput(report.period.end)}.${format}`
    return new NextResponse(new Uint8Array(body), {
      headers: {
        ...privateHeaders,
        'Content-Type':
          format === 'pdf'
            ? 'application/pdf'
            : format === 'zip'
              ? 'application/zip'
              : 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    if (error instanceof ReportAccessError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: privateHeaders },
      )
    console.error(
      '[reports] generation failed',
      error instanceof Error ? error.name : 'UnknownError',
    )
    return NextResponse.json(
      { error: 'No se ha podido generar el informe. Inténtalo de nuevo.' },
      { status: 500, headers: privateHeaders },
    )
  }
}
