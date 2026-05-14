/**
 * Generate the official AEAT Verifactu QR validation URL.
 *
 * Reference:
 *   - Orden Ministerial HFP/718/2023 (art. 20-21)
 *   - AEAT TIKE-CONT / ValidarQR service
 *
 * Base URLs:
 *   - Pruebas Verifactu:  https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR
 *   - Produccion Verifactu: https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR
 *   - Pruebas No-Verifactu:  https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQRNoVerifactu
 *   - Produccion No-Verifactu: https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQRNoVerifactu
 *
 * Parameters:
 *   - nif:      NIF del emisor (9 chars, no spaces)
 *   - numserie: Serie + numero de factura (max 60 chars, URL-encoded)
 *   - fecha:    Fecha de expedicion (DD-MM-YYYY)
 *   - importe:  Importe total con punto decimal (max 12+2 digits)
 */

export interface AEATQROptions {
  /** NIF del emisor (9 caracteres, sin espacios ni guiones) */
  nif: string
  /** Serie + numero de factura combinados (max 60 caracteres) */
  serieNumero: string
  /** Fecha de expedicion de la factura */
  fecha: Date
  /** Importe total de la factura */
  importe: number
  /** true = produccion, false = pruebas (default: false) */
  isProduction?: boolean
  /** true = modalidad Verifactu, false = No-Verifactu (default: true) */
  isVerifactu?: boolean
}

const BASE_URLS = {
  pruebas_verifactu: 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR',
  produccion_verifactu: 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR',
  pruebas_no_verifactu: 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQRNoVerifactu',
  produccion_no_verifactu: 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQRNoVerifactu',
}

function formatDateDDMMYYYY(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}-${m}-${y}`
}

function formatImporte(value: number): string {
  // AEAT uses dot as decimal separator, max 12 integer + 2 decimal digits
  return value.toFixed(2)
}

function normalizeNif(nif: string): string {
  return nif.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 9)
}

/**
 * Build the official AEAT QR validation URL.
 */
export function generateAEATQRUrl(options: AEATQROptions): string {
  const {
    nif,
    serieNumero,
    fecha,
    importe,
    isProduction = false,
    isVerifactu = true,
  } = options

  let baseUrl: string
  if (isProduction && isVerifactu) {
    baseUrl = BASE_URLS.produccion_verifactu
  } else if (isProduction && !isVerifactu) {
    baseUrl = BASE_URLS.produccion_no_verifactu
  } else if (!isProduction && isVerifactu) {
    baseUrl = BASE_URLS.pruebas_verifactu
  } else {
    baseUrl = BASE_URLS.pruebas_no_verifactu
  }

  const params = new URLSearchParams({
    nif: normalizeNif(nif),
    numserie: serieNumero.slice(0, 60),
    fecha: formatDateDDMMYYYY(fecha),
    importe: formatImporte(importe),
  })

  return `${baseUrl}?${params.toString()}`
}

/**
 * Build the AEAT QR URL from invoice data and tenant NIF.
 * Convenience wrapper that uses the fullNumber as serieNumero.
 */
export function generateAEATQRUrlFromInvoice(
  nif: string,
  fullNumber: string,
  issuedAt: Date,
  totalAmount: number,
  isProduction = false,
): string {
  return generateAEATQRUrl({
    nif,
    serieNumero: fullNumber,
    fecha: issuedAt,
    importe: totalAmount,
    isProduction,
    isVerifactu: true,
  })
}
