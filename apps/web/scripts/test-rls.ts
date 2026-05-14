/**
 * Test RLS multi-tenant aislamiento
 *
 * Verifica que las Row-Level Security policies de Supabase aíslan
 * correctamente los datos entre tenants distintos.
 *
 * Cubre 3 modelos críticos: Client, Invoice, Item.
 *
 * Uso: pnpm test:rls
 *
 * Refs: ADR-0002 (RLS), ADR-0013 (resultados de este test)
 */

import { PrismaClient } from '@prisma/client'
import { PostgrestClient } from '@supabase/postgrest-js'
import { sign } from 'jsonwebtoken'
import { randomUUID } from 'crypto'

// ─── Load .env.local ──────────────────────────────────────────
// tsx doesn't auto-load .env.local; we parse it manually
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnvFile(path: string): boolean {
  try {
    const lines = readFileSync(path, 'utf-8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (key && !process.env[key]) process.env[key] = val
    }
    return true
  } catch {
    return false
  }
}

// Try: apps/web/.env.local → monorepo root .env.local
// (pnpm --filter sets cwd to apps/web/)
const cwd = process.cwd()
loadEnvFile(resolve(cwd, '.env.local'))
loadEnvFile(resolve(cwd, '..', '..', '.env.local'))

// ─── ANSI colors ──────────────────────────────────────────────
const c = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red:   (s: string) => `\x1b[31m${s}\x1b[0m`,
  cyan:  (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold:  (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim:   (s: string) => `\x1b[2m${s}\x1b[0m`,
}

const PASS = c.green('✓')
const FAIL = c.red('✗')

// ─── Config ───────────────────────────────────────────────────
const SUPABASE_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_JWT_SECRET) {
  console.error(c.red('✗ Faltan variables de entorno requeridas:'))
  if (!SUPABASE_URL)        console.error(c.dim('  NEXT_PUBLIC_SUPABASE_URL'))
  if (!SUPABASE_ANON_KEY)   console.error(c.dim('  NEXT_PUBLIC_SUPABASE_ANON_KEY'))
  if (!SUPABASE_JWT_SECRET) console.error(c.dim('  SUPABASE_JWT_SECRET'))
  console.error(c.dim('\n  → Añade SUPABASE_JWT_SECRET a apps/web/.env.local'))
  console.error(c.dim('    Dashboard → Settings → API → JWT Settings → JWT Secret'))
  process.exit(1)
}

// Cliente admin (DIRECT_URL) — bypass RLS para setup/teardown
const prisma = new PrismaClient()

// ─── Helper: cliente PostgREST autenticado con JWT firmado ───
function buildAuthClient(userId: string, tenantId: string): PostgrestClient {
  const now = Math.floor(Date.now() / 1000)
  const token = sign(
    {
      iss:        'supabase',
      ref:        SUPABASE_URL!.replace('https://', '').split('.')[0],
      role:       'authenticated',
      aud:        'authenticated',
      sub:        userId,
      tenant_id:  tenantId,
      user_role:  'OWNER',
      iat:        now,
      exp:        now + 3600,
    },
    SUPABASE_JWT_SECRET!
  )

  // Use PostgrestClient directly — bypasses the Supabase JS auth layer
  // which would overwrite our Authorization header with the anon key.
  return new PostgrestClient(`${SUPABASE_URL}/rest/v1`, {
    headers: {
      apikey:        SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${token}`,
    },
  })
}

// ─── Test results ─────────────────────────────────────────────
let passed = 0
let failed = 0
const failures: string[] = []

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ${PASS} ${label}`)
    passed++
  } else {
    console.log(`  ${FAIL} ${c.bold(label)}`)
    if (detail) console.log(c.dim(`     → ${detail}`))
    failed++
    failures.push(label)
  }
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log(c.cyan(c.bold('\n═══ Test RLS Multi-Tenant ═══\n')))

  // ─── Setup ──────────────────────────────────────────────────
  console.log(c.cyan('▸ Setup: creando 2 tenants y datos de prueba...'))

  const verticalCleaning = await prisma.vertical.findUnique({
    where: { slug: 'cleaning' },
  })
  if (!verticalCleaning) {
    throw new Error(
      'Vertical "cleaning" no encontrado en BD. ¿Están aplicadas las seeds 0009?'
    )
  }

  // Pre-cleanup: remove stale tenants from previous failed runs
  const stale = await prisma.tenant.findMany({
    where: { name: { startsWith: 'RLS-TEST-' } },
    select: { id: true },
  })
  if (stale.length > 0) {
    const ids = stale.map((t) => t.id)
    await prisma.invoice.deleteMany({ where: { tenantId: { in: ids } } })
    await prisma.invoiceSeries.deleteMany({ where: { tenantId: { in: ids } } })
    await prisma.item.deleteMany({ where: { tenantId: { in: ids } } })
    await prisma.client.deleteMany({ where: { tenantId: { in: ids } } })
    await prisma.user.deleteMany({ where: { tenantId: { in: ids } } })
    await prisma.brandingConfig.deleteMany({ where: { tenantId: { in: ids } } })
    await prisma.tenant.deleteMany({ where: { id: { in: ids } } })
    console.log(c.dim(`  Pre-cleanup: ${ids.length} tenant(s) huérfano(s) eliminado(s).`))
  }

  // NIFs: 'BA' + últimos 7 dígitos del timestamp = 9 chars únicos por run
  const ts = Date.now()
  const short = String(ts).slice(-7)

  // ── Tenant A ─────────────────────────────────────────────────
  const tenantA = await prisma.tenant.create({
    data: {
      name:       `RLS-TEST-A-${ts}`,
      legalName:  'RLS Test A SL',
      nif:        `BA${short}`,
      verticalId: verticalCleaning.id,
      branding:   { create: {} },
    },
  })
  const userIdA = randomUUID()
  await prisma.user.create({
    data: {
      id:       userIdA,
      email:    `rls-a-${ts}@test.local`,
      tenantId: tenantA.id,
      role:     'OWNER',
    },
  })
  const clientA = await prisma.client.create({
    data: {
      tenantId: tenantA.id,
      name:     'Cliente A1',
      nif:      `XA${short}`,
    },
  })
  const itemA = await prisma.item.create({
    data: {
      tenantId:  tenantA.id,
      name:      'Item A1',
      type:      'service',
      unitPrice: 100,
      vatRate:   21,
    },
  })
  const seriesA = await prisma.invoiceSeries.create({
    data: {
      tenantId:   tenantA.id,
      code:       'A',
      name:       'Facturas estándar',
      nextNumber: 2,
    },
  })
  const invoiceA = await prisma.invoice.create({
    data: {
      tenantId:    tenantA.id,
      clientId:    clientA.id,
      seriesId:    seriesA.id,
      number:      1,
      fullNumber:  'A-2026-0001',
      issuedAt:    new Date(),
      status:      'draft',
      subtotal:    100,
      vatAmount:   21,
      totalAmount: 121,
    },
  })

  // ── Tenant B ─────────────────────────────────────────────────
  const tenantB = await prisma.tenant.create({
    data: {
      name:       `RLS-TEST-B-${ts}`,
      legalName:  'RLS Test B SL',
      nif:        `BB${short}`,
      verticalId: verticalCleaning.id,
      branding:   { create: {} },
    },
  })
  const userIdB = randomUUID()
  await prisma.user.create({
    data: {
      id:       userIdB,
      email:    `rls-b-${ts}@test.local`,
      tenantId: tenantB.id,
      role:     'OWNER',
    },
  })
  const clientB = await prisma.client.create({
    data: {
      tenantId: tenantB.id,
      name:     'Cliente B1',
      nif:      `XB${short}`,
    },
  })
  const itemB = await prisma.item.create({
    data: {
      tenantId:  tenantB.id,
      name:      'Item B1',
      type:      'service',
      unitPrice: 200,
      vatRate:   21,
    },
  })
  const seriesB = await prisma.invoiceSeries.create({
    data: {
      tenantId:   tenantB.id,
      code:       'B',
      name:       'Facturas estándar',
      nextNumber: 2,
    },
  })
  const invoiceB = await prisma.invoice.create({
    data: {
      tenantId:    tenantB.id,
      clientId:    clientB.id,
      seriesId:    seriesB.id,
      number:      1,
      fullNumber:  'B-2026-0001',
      issuedAt:    new Date(),
      status:      'draft',
      subtotal:    200,
      vatAmount:   42,
      totalAmount: 242,
    },
  })

  console.log(c.dim(`  Tenant A: ${tenantA.id}`))
  console.log(c.dim(`  Tenant B: ${tenantB.id}\n`))

  const supaA = buildAuthClient(userIdA, tenantA.id)
  const supaB = buildAuthClient(userIdB, tenantB.id)

  // ─── Test 1: SELECT aislamiento ──────────────────────────────
  console.log(c.cyan('▸ Test 1: SELECT aislamiento'))

  const { data: clientsA } = await supaA.from('clients').select('*')
  check(
    'User A solo ve sus clientes',
    !!clientsA && clientsA.length === 1 && clientsA[0]?.id === clientA.id,
    `count=${clientsA?.length}, expected=1`
  )

  const { data: clientsB } = await supaB.from('clients').select('*')
  check(
    'User B solo ve sus clientes',
    !!clientsB && clientsB.length === 1 && clientsB[0]?.id === clientB.id,
    `count=${clientsB?.length}, expected=1`
  )

  const { data: invoicesA } = await supaA.from('invoices').select('*')
  check(
    'User A solo ve sus facturas',
    !!invoicesA && invoicesA.length === 1 && invoicesA[0]?.id === invoiceA.id,
    `count=${invoicesA?.length}, expected=1`
  )

  const { data: invoicesB } = await supaB.from('invoices').select('*')
  check(
    'User B solo ve sus facturas',
    !!invoicesB && invoicesB.length === 1 && invoicesB[0]?.id === invoiceB.id,
    `count=${invoicesB?.length}, expected=1`
  )

  const { data: itemsA } = await supaA.from('items').select('*')
  check(
    'User A solo ve sus items',
    !!itemsA && itemsA.length === 1 && itemsA[0]?.id === itemA.id,
    `count=${itemsA?.length}, expected=1`
  )

  const { data: itemsB } = await supaB.from('items').select('*')
  check(
    'User B solo ve sus items',
    !!itemsB && itemsB.length === 1 && itemsB[0]?.id === itemB.id,
    `count=${itemsB?.length}, expected=1`
  )

  // ─── Test 2: SELECT por ID ajeno ─────────────────────────────
  console.log(c.cyan('\n▸ Test 2: SELECT por ID ajeno — debe devolver vacío'))

  const { data: stolenClient } = await supaA
    .from('clients').select('*').eq('id', clientB.id).maybeSingle()
  check('A intenta SELECT cliente de B por id → null', stolenClient === null)

  const { data: stolenInvoice } = await supaA
    .from('invoices').select('*').eq('id', invoiceB.id).maybeSingle()
  check('A intenta SELECT factura de B por id → null', stolenInvoice === null)

  const { data: stolenItem } = await supaA
    .from('items').select('*').eq('id', itemB.id).maybeSingle()
  check('A intenta SELECT item de B por id → null', stolenItem === null)

  // ─── Test 3: INSERT en tenant ajeno ──────────────────────────
  console.log(c.cyan('\n▸ Test 3: INSERT en tenant ajeno — debe ser rechazado'))

  const { error: insertClientErr } = await supaA.from('clients').insert({
    tenant_id: tenantB.id,
    name:      'Hacked Client',
    nif:       'X9999999X',
  })
  check(
    'A intenta INSERT cliente en tenant B → error',
    !!insertClientErr,
    insertClientErr?.message
  )

  const { error: insertItemErr } = await supaA.from('items').insert({
    tenant_id:  tenantB.id,
    name:       'Hacked Item',
    type:       'service',
    unit_price: 0,
    vat_rate:   21,
  })
  check(
    'A intenta INSERT item en tenant B → error',
    !!insertItemErr,
    insertItemErr?.message
  )

  // ─── Test 4: UPDATE de datos ajenos ──────────────────────────
  console.log(c.cyan('\n▸ Test 4: UPDATE de datos ajenos — debe ser silenciado'))

  const { error: updateErr, data: updateData } = await supaA
    .from('clients')
    .update({ name: 'Hacked Name' })
    .eq('id', clientB.id)
    .select()
  check(
    'A intenta UPDATE cliente de B → 0 filas o error',
    !!updateErr || !updateData || updateData.length === 0,
    updateErr?.message ?? `rows=${updateData?.length}`
  )

  const clientBAfter = await prisma.client.findUnique({ where: { id: clientB.id } })
  check(
    'Cliente B mantiene nombre original tras intento UPDATE',
    clientBAfter?.name === 'Cliente B1',
    `actual="${clientBAfter?.name}"`
  )

  // ─── Test 5: DELETE de datos ajenos ──────────────────────────
  console.log(c.cyan('\n▸ Test 5: DELETE de datos ajenos — debe ser silenciado'))

  const { error: deleteErr, data: deleteData } = await supaA
    .from('clients')
    .delete()
    .eq('id', clientB.id)
    .select()
  check(
    'A intenta DELETE cliente de B → 0 filas o error',
    !!deleteErr || !deleteData || deleteData.length === 0,
    deleteErr?.message ?? `rows=${deleteData?.length}`
  )

  const clientBStillThere = await prisma.client.findUnique({ where: { id: clientB.id } })
  check(
    'Cliente B sigue existiendo tras intento DELETE',
    clientBStillThere !== null
  )

  // ─── Teardown ────────────────────────────────────────────────
  console.log(c.cyan('\n▸ Teardown: limpiando datos de prueba...'))

  const tenantIds = [tenantA.id, tenantB.id]
  await prisma.invoice.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await prisma.invoiceSeries.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await prisma.item.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await prisma.client.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await prisma.user.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await prisma.brandingConfig.deleteMany({ where: { tenantId: { in: tenantIds } } })
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })

  console.log(c.dim('  Datos de prueba eliminados.\n'))

  // ─── Reporte final ───────────────────────────────────────────
  console.log(c.cyan(c.bold('═══ Resultado ═══')))
  console.log(`  ${c.green(`✓ ${passed} pasaron`)}`)
  if (failed > 0) {
    console.log(`  ${c.red(`✗ ${failed} fallaron`)}`)
    failures.forEach((f) => console.log(c.red(`    - ${f}`)))
    console.log()
  } else {
    console.log()
  }

  await prisma.$disconnect()
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(async (err) => {
  console.error(c.red('\n✗ Error fatal en test-rls:'))
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
