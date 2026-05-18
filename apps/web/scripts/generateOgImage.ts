import sharp from 'sharp'
import path from 'path'

const SRC  = path.resolve('apps/web/sanity/seed/covers/cover-tesoreria.png')
const DEST = path.resolve('apps/web/public/og-image.jpg')

sharp(SRC)
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 85 })
  .toFile(DEST)
  .then(() => console.log(`✅ og-image.jpg saved to ${DEST}`))
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  })
