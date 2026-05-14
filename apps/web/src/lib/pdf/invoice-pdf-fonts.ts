import { Font } from '@react-pdf/renderer'

let fontsRegistered = false

/**
 * Registers fonts for PDF generation.
 *
 * Uses absolute URLs from Google Fonts CDN (fonts.gstatic.com) in .ttf format
 * instead of local .woff2 files.
 *
 * Reason: @react-pdf/renderer only supports TTF and WOFF officially.
 * The internal fontkit parser throws "RangeError: Offset is outside the bounds
 * of the DataView" when given .woff2 files.
 *
 * URLs verified 2026-05-06 via fonts.googleapis.com CSS API.
 * If URLs break, fallback: download .ttf files to /public/fonts/ and use
 * path.join(process.cwd(), 'public/fonts', filename) instead.
 */
export function registerPdfFonts() {
  if (fontsRegistered) return

  // Inter — sans-serif for body text
  Font.register({
    family: 'Inter',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hjQ.ttf',
        fontWeight: 500,
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.ttf',
        fontWeight: 700,
      },
    ],
  })

  // Lora — serif for headings and key numbers
  Font.register({
    family: 'Lora',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkqg.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787z5vBJBkqg.ttf',
        fontWeight: 700,
      },
    ],
  })

  // Disable hyphenation to prevent random mid-word breaks
  Font.registerHyphenationCallback((word) => [word])

  fontsRegistered = true
}
