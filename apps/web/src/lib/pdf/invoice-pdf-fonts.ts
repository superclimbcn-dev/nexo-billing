import { Font } from '@react-pdf/renderer'
import path from 'path'

let fontsRegistered = false

function fontPath(filename: string): string {
  return path.join(process.cwd(), 'public/fonts', filename)
}

export function registerPdfFonts() {
  if (fontsRegistered) return

  Font.register({
    family: 'Inter',
    fonts: [
      { src: fontPath('Inter-Regular.woff2'), fontWeight: 400 },
      { src: fontPath('Inter-Medium.woff2'), fontWeight: 500 },
      { src: fontPath('Inter-Bold.woff2'), fontWeight: 700 },
    ],
  })

  Font.register({
    family: 'Lora',
    fonts: [
      { src: fontPath('Lora-Regular.woff2'), fontWeight: 400 },
      { src: fontPath('Lora-Bold.woff2'), fontWeight: 700 },
    ],
  })

  // Disable hyphenation to prevent random mid-word breaks
  Font.registerHyphenationCallback((word) => [word])

  fontsRegistered = true
}
