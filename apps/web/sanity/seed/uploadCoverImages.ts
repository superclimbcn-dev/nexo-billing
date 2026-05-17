import { createClient } from '@sanity/client'
import https from 'https'

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

const images = [
  {
    url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1280&q=80',
    slug: 'que-es-verifactu-obligatorio-2027',
    filename: 'cover-que-es-verifactu-obligatorio-2027.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1280&q=80',
    slug: 'guia-modelo-130-autonomos',
    filename: 'cover-guia-modelo-130-autonomos.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&q=80',
    slug: 'mejores-apps-facturacion-autonomos-espana-2026',
    filename: 'cover-mejores-apps-facturacion-autonomos-espana-2026.jpg',
  },
]

function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(fetchBuffer(res.headers.location))
        return
      }
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })
    req.on('error', reject)
  })
}

async function main() {
  for (const img of images) {
    process.stdout.write(`\n📥 Downloading ${img.slug} … `)
    const buffer = await fetchBuffer(img.url)
    console.log(`${buffer.length} bytes`)

    process.stdout.write(`⬆️  Uploading to Sanity … `)
    const asset = await client.assets.upload('image', buffer, {
      filename: img.filename,
      contentType: 'image/jpeg',
    })
    console.log(`asset ${asset._id}`)

    process.stdout.write(`🔗 Patching article "${img.slug}" … `)
    const result = await client
      .patch({ query: `*[_type == "post" && slug.current == "${img.slug}"]` })
      .set({
        coverImage: {
          _type: 'image',
          asset: { _type: 'reference', _ref: asset._id },
        },
      })
      .commit()
    console.log(`✅ updated ${result.length ?? 1} document(s)`)
  }

  console.log('\n✅ All 3 cover images uploaded and associated.')
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e))
  process.exit(1)
})
