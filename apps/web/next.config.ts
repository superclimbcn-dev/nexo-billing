import path from 'path'
import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@nexo/core-ui'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  serverExternalPackages: ['@prisma/client'],
}

export default config
