import path from 'path'
import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@nexo/core-ui'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  outputFileTracingIncludes: {
    '/**/*': [
      '../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*',
      '../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/**/*',
      '../../infrastructure/prisma/prisma/**/*',
    ],
    '/api/**/*': [
      '../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*',
    ],
    '/facturas/**/*': [
      '../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*',
    ],
    '/f/**/*': [
      '../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*',
    ],
  },
  serverExternalPackages: ['@prisma/client'],
}

export default config
