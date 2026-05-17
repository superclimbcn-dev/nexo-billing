import { createClient } from '@sanity/client'

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const DATASET    = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const TOKEN      = process.env.SANITY_API_TOKEN ?? ''

if (!PROJECT_ID || !TOKEN) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_TOKEN')
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2024-01-01',
  token: TOKEN,
  useCdn: false,
})

const SLUG        = 'mejores-apps-facturacion-autonomos-espana-2026'
const OLD_TEXT    = 'Sin integración bancaria aún (en roadmap 2026)'
const NEW_TEXT    = '✅ Cobro automático SEPA via GoCardless incluido'

type PortableTextSpan = {
  _type: string
  _key: string
  text: string
  marks?: string[]
}

type PortableTextBlock = {
  _type: string
  _key: string
  children?: PortableTextSpan[]
  [key: string]: unknown
}

async function main() {
  console.log(`🔍 Fetching article "${SLUG}" …`)

  const doc = await client.fetch<{ _id: string; body: PortableTextBlock[] } | null>(
    `*[_type == "post" && slug.current == $slug][0]{ _id, body }`,
    { slug: SLUG }
  )

  if (!doc) {
    console.error(`Article "${SLUG}" not found`)
    process.exit(1)
  }

  console.log(`📄 Article ID: ${doc._id}`)

  if (!Array.isArray(doc.body)) {
    console.error('body field is missing or not an array')
    process.exit(1)
  }

  let found = false
  const updatedBody = doc.body.map((block) => {
    if (!Array.isArray(block.children)) return block

    const updatedChildren = block.children.map((span) => {
      if (span._type === 'span' && typeof span.text === 'string' && span.text.includes(OLD_TEXT)) {
        found = true
        console.log(`✏️  Found text in block ${block._key}, span ${span._key}`)
        return { ...span, text: span.text.replace(OLD_TEXT, NEW_TEXT) }
      }
      return span
    })

    return { ...block, children: updatedChildren }
  })

  if (!found) {
    console.error(`Text not found: "${OLD_TEXT}"`)
    console.log('\nSearching all span texts for debugging:')
    doc.body.forEach((block) => {
      block.children?.forEach((span) => {
        if (span.text?.trim()) console.log(' -', JSON.stringify(span.text))
      })
    })
    process.exit(1)
  }

  process.stdout.write('⬆️  Patching Sanity document … ')
  await client.patch(doc._id).set({ body: updatedBody }).commit()
  console.log('✅ Done')

  console.log(`\n✅ Patch applied: "${OLD_TEXT}" → "${NEW_TEXT}"`)
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e))
  process.exit(1)
})
