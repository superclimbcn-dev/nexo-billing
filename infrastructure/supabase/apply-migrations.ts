import { createHash } from 'crypto'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { Client } from 'pg'

const MIGRATIONS_DIR = join(__dirname, 'migrations')
const APPLIED_TABLE = 'schema_migrations'

async function createMigrationsTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${APPLIED_TABLE} (
      id           TEXT        PRIMARY KEY,
      applied_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      content_hash TEXT
    )
  `)
  // Idempotent: add content_hash column to existing tables that predate this change
  await client.query(`
    ALTER TABLE ${APPLIED_TABLE} ADD COLUMN IF NOT EXISTS content_hash TEXT
  `)
}

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

async function getAppliedMigrations(client: Client): Promise<Map<string, string | null>> {
  const result = await client.query<{ id: string; content_hash: string | null }>(
    `SELECT id, content_hash FROM ${APPLIED_TABLE}`
  )
  return new Map(result.rows.map((r) => [r.id, r.content_hash]))
}

async function applyMigration(
  client: Client,
  file: string,
  sql: string,
  hash: string,
  isUpdate: boolean,
) {
  await client.query('BEGIN')
  try {
    await client.query(sql)
    if (isUpdate) {
      await client.query(
        `UPDATE ${APPLIED_TABLE} SET content_hash = $1, applied_at = NOW() WHERE id = $2`,
        [hash, file],
      )
    } else {
      await client.query(
        `INSERT INTO ${APPLIED_TABLE} (id, content_hash) VALUES ($1, $2)`,
        [file, hash],
      )
    }
    await client.query('COMMIT')
    const reason = isUpdate ? '(re-applied: content changed)' : ''
    console.log(`  ✓ ${file} ${reason}`.trimEnd())
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

async function main() {
  const directUrl = process.env.DIRECT_URL
  if (!directUrl) throw new Error('DIRECT_URL environment variable is required')

  const client = new Client({ connectionString: directUrl })
  await client.connect()
  console.log('Connected to database.')

  try {
    await createMigrationsTable(client)
    const applied = await getAppliedMigrations(client)

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    let newCount = 0
    let updatedCount = 0

    for (const file of files) {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8')
      const hash = sha256(sql)

      if (!applied.has(file)) {
        await applyMigration(client, file, sql, hash, false)
        newCount++
      } else if (applied.get(file) !== hash) {
        console.log(`  ↻ ${file} — hash changed, re-applying`)
        await applyMigration(client, file, sql, hash, true)
        updatedCount++
      } else {
        console.log(`  · ${file} (up to date)`)
      }
    }

    const total = newCount + updatedCount
    if (total === 0) {
      console.log('All migrations up to date.')
    } else {
      if (newCount > 0) console.log(`\nApplied ${newCount} new migration(s).`)
      if (updatedCount > 0) console.log(`Re-applied ${updatedCount} changed migration(s).`)
    }
  } finally {
    await client.end()
  }
}

main().catch((err: unknown) => {
  console.error('Migration failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
