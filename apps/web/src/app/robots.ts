import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api',
        '/auth',
        '/auth-error',
        '/check-email',
        '/clientes',
        '/dashboard',
        '/f',
        '/facturas',
        '/gastos',
        '/impuestos',
        '/login',
        '/onboarding',
        '/presupuestos',
        '/productos',
        '/recurrentes',
        '/settings',
        '/signup',
        '/spoiler',
        '/tesoreria',
      ],
    },
    sitemap: 'https://billing.nexo-digital.app/sitemap.xml',
    host: 'https://billing.nexo-digital.app',
  }
}
