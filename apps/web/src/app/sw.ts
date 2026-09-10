import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { NetworkOnly, Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: WorkerGlobalScope & {
  addEventListener: typeof globalThis.addEventListener
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Reports and their previews must never be served from an offline cache.
      matcher: ({ url }) => ['/api/reports', '/informes', '/tesoreria', '/impuestos'].includes(url.pathname),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        matcher: ({ request }) => request.mode === 'navigate',
        url: '/offline.html',
      },
    ],
  },
})

serwist.addEventListeners()
