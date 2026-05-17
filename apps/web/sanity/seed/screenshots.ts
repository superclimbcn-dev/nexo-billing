/**
 * Screenshot + Sanity upload script (Supabase cookie injection).
 *
 * HOW TO GET YOUR COOKIE:
 *   1. Open https://billing.nexo-digital.app in Chrome (logged in)
 *   2. F12 → Application → Cookies → billing.nexo-digital.app
 *   3. Find the cookie "sb-jiyisxyqxzblmwxisgpx-auth-token"
 *   4. Copy its Value
 *   5. Run:
 *        SUPABASE_COOKIE='<pasted_value>' \
 *        NEXT_PUBLIC_SANITY_PROJECT_ID=rj27hyra \
 *        SANITY_API_TOKEN=<token> \
 *        npx tsx apps/web/sanity/seed/screenshots.ts
 */
import { chromium } from '@playwright/test'
import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'https://billing.nexo-digital.app'
const COVERS_DIR = path.join(__dirname, 'covers')

const COOKIE_VALUE = process.env.SUPABASE_COOKIE ?? ''
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const TOKEN = process.env.SANITY_API_TOKEN ?? ''

if (!COOKIE_VALUE) {
  console.error('❌  Set SUPABASE_COOKIE — see instructions at top of this file.')
  process.exit(1)
}
if (!PROJECT_ID || !TOKEN) {
  console.error('❌  Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN.')
  process.exit(1)
}

const sanity = createClient({
  projectId: PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: TOKEN,
  useCdn: false,
})

const SCREENSHOTS: Array<{ route: string; fallbacks?: string[]; file: string }> = [
  { route: '/facturas/nueva', fallbacks: ['/facturas/nova', '/facturas'], file: 'cover-facturas.png' },
  { route: '/presupuestos',  file: 'cover-presupuestos.png' },
  { route: '/recurrentes',   file: 'cover-recurrentes.png' },
  { route: '/tesoreria',     file: 'cover-tesoreria.png' },
  { route: '/impuestos',     file: 'cover-impuestos.png' },
  { route: '/gastos',        file: 'cover-gastos.png' },
]

const SLUG_TO_COVER: Record<string, string> = {
  'como-crear-primera-factura':                'cover-facturas.png',
  'gestionar-presupuestos-convertir-facturas': 'cover-presupuestos.png',
  'automatizar-facturas-recurrentes':          'cover-recurrentes.png',
  'controlar-tesoreria-autonomo':              'cover-tesoreria.png',
  'preparar-modelo-303-nexo-billing':          'cover-impuestos.png',
  'registrar-categorizar-gastos':              'cover-gastos.png',
}

// ─── Step 1: screenshots ──────────────────────────────────────────────────────

async function takeScreenshots() {
  fs.mkdirSync(COVERS_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.setViewportSize({ width: 1280, height: 720 })

  // Navigate first to establish the domain context, then inject the cookie
  // via document.cookie (bypasses Playwright's addCookies validator which
  // rejects the raw Supabase "base64-..." session format).
  console.log('🔐 Injecting session…')
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })

  await page.evaluate((cookieValue: string) => {
    const expires = new Date(Date.now() + 86400 * 1000).toUTCString() // 24 h
    document.cookie = [
      `sb-jiyisxyqxzblmwxisgpx-auth-token=${cookieValue}`,
      'path=/',
      `expires=${expires}`,
      'samesite=lax',
      'secure',
    ].join('; ')
  }, COOKIE_VALUE)

  // Verify session is valid
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })

  if (page.url().includes('/login')) {
    await browser.close()
    throw new Error(
      '❌  Cookie rejected — redirected to /login.\n' +
      '    Copy a fresh cookie value from DevTools → Application → Cookies and try again.',
    )
  }

  const bodyText = await page.locator('body').innerText()
  const isAuthenticated =
    bodyText.includes('Buenos días') ||
    bodyText.includes('Buenas tardes') ||
    bodyText.includes('Buenas noches') ||
    bodyText.includes('dashboard') ||
    !page.url().includes('/login')

  if (!isAuthenticated) {
    await browser.close()
    throw new Error('❌  Session appears invalid — could not confirm authenticated state.')
  }
  console.log('✅ Authenticated —', page.url())

  for (const { route, fallbacks = [], file } of SCREENSHOTS) {
    const routes = [route, ...fallbacks]
    let captured = false

    for (const r of routes) {
      process.stdout.write(`📸 ${r.padEnd(22)} → ${file} … `)
      await page.goto(`${BASE_URL}${r}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1200) // let charts/animations settle

      // Detect error pages (Next.js 404/500 or redirects to login)
      const status = page.url()
      const bodyText = await page.locator('body').innerText().catch(() => '')
      const isError =
        status.includes('/login') ||
        bodyText.toLowerCase().includes('404') ||
        bodyText.toLowerCase().includes('page not found') ||
        bodyText.toLowerCase().includes('error')

      if (isError && routes.indexOf(r) < routes.length - 1) {
        console.log(`error page, trying fallback…`)
        continue
      }

      await page.screenshot({ path: path.join(COVERS_DIR, file), type: 'png' })
      console.log('saved')
      captured = true
      break
    }

    if (!captured) {
      console.warn(`⚠️  Could not capture ${file} — all routes returned errors`)
    }
  }

  await browser.close()
  console.log(`\n✅ ${SCREENSHOTS.length} screenshots saved to ${COVERS_DIR}\n`)
}

// ─── Step 2: upload + link ────────────────────────────────────────────────────

async function uploadAndLink() {
  const slugs = Object.keys(SLUG_TO_COVER)
  const posts: Array<{ _id: string; slug: string }> = await sanity.fetch(
    `*[_type == "post" && slug.current in $slugs]{ _id, "slug": slug.current }`,
    { slugs },
  )
  console.log(`Found ${posts.length} posts to update`)

  const assetCache: Record<string, string> = {}

  for (const post of posts) {
    const coverFile = SLUG_TO_COVER[post.slug]
    if (!coverFile) continue

    const filePath = path.join(COVERS_DIR, coverFile)
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  ${coverFile} not found — skipping ${post.slug}`)
      continue
    }

    if (!assetCache[coverFile]) {
      process.stdout.write(`⬆️  Uploading ${coverFile} … `)
      const buffer = fs.readFileSync(filePath)
      const asset = await sanity.assets.upload('image', buffer, {
        filename: coverFile,
        contentType: 'image/png',
      })
      assetCache[coverFile] = asset._id
      console.log(`asset ${asset._id}`)
    }

    await sanity
      .patch(post._id)
      .set({
        coverImage: {
          _type: 'image',
          asset: { _type: 'reference', _ref: assetCache[coverFile] },
        },
      })
      .commit()

    console.log(`✅ ${post.slug}`)
  }

  console.log('\n🎉 All cover images linked in Sanity!')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await takeScreenshots()
  await uploadAndLink()
}

main().catch((err: unknown) => {
  console.error((err instanceof Error ? err.message : String(err)))
  process.exit(1)
})
