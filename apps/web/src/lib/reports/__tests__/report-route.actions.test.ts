import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/reports/route'
import { fixtureReport } from './report-fixtures'
import { ReportAccessError } from '../report-data'

const mocks = vi.hoisted(() => ({ report: vi.fn() }))
vi.mock('../report-data', () => ({
  getAccountingReport: mocks.report,
  ReportAccessError: class extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message)
    }
  },
}))
beforeEach(() => {
  vi.resetAllMocks()
  mocks.report.mockResolvedValue(fixtureReport())
})
const url = 'http://localhost/api/reports?report=advisor&period=quarter&year=2026&quarter=Q3'

describe('private report downloads', () => {
  it.each([401, 403])('returns %i without file contents when access is denied', async (status) => {
    mocks.report.mockRejectedValue(new ReportAccessError(status, 'Acceso denegado'))
    const response = await GET(new NextRequest(`${url}&format=csv`))
    expect(response.status).toBe(status)
    expect(response.headers.get('Cache-Control')).toContain('no-store')
    expect(await response.text()).not.toContain('Superclim')
  })
  it('rejects invalid periods and attempts to choose another tenant', async () => {
    const response = await GET(new NextRequest(`${url}&format=csv&tenantId=other`))
    expect(response.status).toBe(400)
    expect(mocks.report).not.toHaveBeenCalled()
  })
  it.each(['csv', 'zip', 'pdf'])(
    'returns an authenticated %s attachment with caching disabled',
    async (format) => {
      const response = await GET(new NextRequest(`${url}&format=${format}`))
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Disposition')).toContain(
        `attachment; filename="nexo_advisor_2026-07-01_2026-09-30.${format}"`,
      )
      expect(response.headers.get('Cache-Control')).toBe('private, no-store, max-age=0')
      expect(response.headers.get('Vary')).toBe('Cookie')
      expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(100)
    },
    30000,
  )
})
