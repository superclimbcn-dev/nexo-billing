// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ReportControls, ReportDownloadButtons } from '@/app/(app)/informes/_components/report-controls'
import { request } from './report-fixtures'

const mocks = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }), usePathname: () => '/informes' }))
let container: HTMLDivElement
let root: Root
beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('report download and period controls', () => {
  it('blocks downloading a redirected login page as a report', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ redirected: true, ok: true }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await act(async () => root.render(<ReportDownloadButtons request={request} />))
    await act(async () => container.querySelector('button')!.click())
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('sesión ha caducado')
    expect(click).not.toHaveBeenCalled()
  })
  it('rejects an HTML response with HTTP 200 instead of downloading it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ redirected: false, ok: true, headers: new Headers({ 'Content-Type': 'text/html' }) }))
    await act(async () => root.render(<ReportDownloadButtons request={request} />))
    await act(async () => container.querySelector('button')!.click())
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('informe válido')
  })
  it('downloads the selected format and period using the authenticated attachment name', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue({ redirected: false, ok: true,
      headers: new Headers({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="report.csv"' }),
      blob: async () => new Blob(['test']),
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:report', revokeObjectURL: vi.fn() })
    let filename = ''
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { filename = this.download })
    await act(async () => root.render(<ReportDownloadButtons request={request} />))
    await act(async () => container.querySelectorAll('button')[1]!.click())
    expect(filename).toBe('report.csv')
    expect(fetchMock.mock.calls[0]![0]).toContain('format=csv')
    expect(fetchMock.mock.calls[0]![0]).toContain('quarter=Q3')
    expect(fetchMock.mock.calls[0]![1]).toEqual({ credentials: 'same-origin', cache: 'no-store' })
    vi.runAllTimers()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:report')
  })
  it('requires applying changed filters so exports cannot disagree with the preview', async () => {
    await act(async () => root.render(<ReportControls request={request} />))
    const periodSelect = container.querySelector('select')!
    await act(async () => { periodSelect.value = 'year'; periodSelect.dispatchEvent(new Event('change', { bubbles: true })) })
    const exportButtons = Array.from(container.querySelectorAll('button')).filter((button) => button.textContent?.startsWith('Exportar'))
    expect(exportButtons.every((button) => button.disabled)).toBe(true)
    await act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
    expect(mocks.push).toHaveBeenCalledWith(expect.stringContaining('period=year'))
  })
})
