import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { Client } from 'pg'

const MIGRATIONS_DIR = join(__dirname, 'migrations')
const APPLIED_TABLE = 'schema_migrations'

async function createMigrationsTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${APPLIED_TABLE} (
      id         TEXT        PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function getAppliedMigrations(client: Client): Promise<Set<string>> {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM ${APPLIED_TABLE}`
  )
  return new Set(result.rows.map((r) => r.id))
}

async function applyMigration(client: Client, file: string, sql: string) {
  await client.query('BEGIN')
  try {
    await client.query(sql)
    await client.query(`INSERT INTO ${APPLIED_TABLE} (id) VALUES ($1)`, [file])
    await client.query('COMMIT')
    console.log(`  ✓ ${file}`)
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

    let count = 0
    for (const file of files) {
      if (!applied.has(file)) {
        const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8')
        await applyMigration(client, file, sql)
        count++
      } else {
        console.log(`  · ${file} (already applied)`)
      }
    }

    if (count === 0) {
      console.log('All migrations already applied.')
    } else {
      console.log(`\nApplied ${count} migration(s) successfully.`)
    }
  } finally {
    await client.end()
  }
}

main().catch((err: unknown) => {
  console.error('Migration failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
