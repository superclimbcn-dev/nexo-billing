#!/usr/bin/env tsx
/**
 * Generate screenshots of Nexo Billing for blog articles.
 *
 * Prerequisites:
 * 1. pnpm install (to get @playwright/test and chromium)
 * 2. npx playwright install chromium
 * 3. Log in to the app manually in your default browser profile,
 *    OR set SCREENSHOT_AUTH_TOKEN with a valid Supabase access_token.
 *
 * Usage:
 *   pnpm tsx scripts/generate-blog-screenshots.ts
 *
 * The script saves screenshots to public/blog/screenshots/
 */

import { chromium, type Browser, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const OUT_DIR = path.join(__dirname, '..', 'public', 'blog', 'screenshots')
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'https://dev.billing.nexo-digital.app'
const AUTH_TOKEN = process.env.SCREENSHOT_AUTH_TOKEN

const SHOTS = [
  {
    name: 'dashboard-overview',
    url: '/dashboard',
    description: 'Vista general de tu facturación',
    waitFor: '[data-testid="dashboard-kpi"], .kpi, h1, main',
  },
  {
    name: 'crear-factura-form',
    url: '/facturas/nueva',
    description: 'Formulario para crear factura',
    waitFor: 'form, input, button',
  },
  {
    name: 'lista-facturas',
    url: '/facturas',
    description: 'Todas tus facturas',
    waitFor: 'table, tbody, tr, .invoice-row',
  },
  {
    name: 'tesoreria-cashflow',
    url: '/tesoreria',
    description: 'Control de tesorería',
    waitFor: 'main, .chart, h1',
  },
  {
    name: 'impuestos-303-130',
    url: '/impuestos',
    description: 'Modelos 303 y 130',
    waitFor: 'main, h1',
  },
  {
    name: 'lista-clientes',
    url: '/clientes',
    description: 'Gestión de clientes',
    waitFor: 'table, tbody, tr, .client-row',
  },
  {
    name: 'configurar-email',
    url: '/settings/email',
    description: 'Configuración de email',
    waitFor: 'form, input, button',
  },
  {
    name: 'blog-home',
    url: '/blog',
    description: 'Blog de Nexo Billing',
    waitFor: 'main, h1',
  },
]

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

async function setAuthCookie(page: Page, token: string) {
  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co').hostname.split('.')[0]
  const cookieName = `sb-${projectRef}-auth-token`
  await page.context().addCookies([
    {
      name: cookieName,
      value: Buffer.from(JSON.stringify({ access_token: token, refresh_token: '', token_type: 'bearer' })).toString('base64'),
      domain: new URL(BASE_URL).hostname,
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
  ])
}

async function takeScreenshot(page: Page, shot: (typeof SHOTS)[number]) {
  const fullUrl = `${BASE_URL}${shot.url}`
  console.log(`📸 ${shot.name}: ${fullUrl}`)

  await page.goto(fullUrl, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // Wait for selector if specified
  if (shot.waitFor) {
    try {
      await page.waitForSelector(shot.waitFor, { timeout: 5000 })
    } catch {
      console.warn(`  ⚠️ Selector not found: ${shot.waitFor}`)
    }
  }

  const filePath = path.join(OUT_DIR, `${shot.name}.png`)
  await page.screenshot({ path: filePath, fullPage: false, type: 'png' })
  console.log(`  ✅ Saved: ${filePath}`)
}

async function main() {
  await ensureDir(OUT_DIR)

  console.log('🚀 Generating blog screenshots...')
  console.log(`   Base URL: ${BASE_URL}`)
  console.log(`   Output:   ${OUT_DIR}`)
  console.log('')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  // Set auth cookie if token provided
  if (AUTH_TOKEN) {
    console.log('🔑 Using provided auth token')
    await setAuthCookie(page, AUTH_TOKEN)
  } else {
    console.log('⚠️  No SCREENSHOT_AUTH_TOKEN set.')
    console.log('   To capture protected pages, log in first and export your Supabase auth cookie,')
    console.log('   or set SCREENSHOT_AUTH_TOKEN env variable.')
    console.log('')
  }

  let success = 0
  let failed = 0

  for (const shot of SHOTS) {
    try {
      await takeScreenshot(page, shot)
      success++
    } catch (err) {
      console.error(`  ❌ Failed: ${shot.name} — ${err instanceof Error ? err.message : String(err)}`)
      failed++
    }
  }

  await browser.close()

  console.log('')
  console.log(`📊 Done: ${success} success, ${failed} failed`)
  console.log(`📁 Output: ${OUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
