import { describe, it, expect } from 'vitest'
import { generateAEATQRUrl, generateAEATQRUrlFromInvoice } from './aeat-qr'

describe('generateAEATQRUrl', () => {
  it('generates pruebas Verifactu URL by default', () => {
    const url = generateAEATQRUrl({
      nif: 'B12345678',
      serieNumero: 'F2024-00042',
      fecha: new Date('2024-06-15'),
      importe: 121.0,
    })
    expect(url).toMatch(/^https:\/\/prewww2\.aeat\.es\/wlpl\/TIKE-CONT\/ValidarQR\?/)
    expect(url).toContain('nif=B12345678')
    expect(url).toContain('numserie=F2024-00042')
    expect(url).toContain('fecha=15-06-2024')
    expect(url).toContain('importe=121.00')
  })

  it('generates produccion Verifactu URL when isProduction=true', () => {
    const url = generateAEATQRUrl({
      nif: 'B12345678',
      serieNumero: 'F2024-00042',
      fecha: new Date('2024-06-15'),
      importe: 121.0,
      isProduction: true,
    })
    expect(url).toMatch(/^https:\/\/www2\.agenciatributaria\.gob\.es\/wlpl\/TIKE-CONT\/ValidarQR\?/)
  })

  it('generates No-Verifactu URL when isVerifactu=false', () => {
    const url = generateAEATQRUrl({
      nif: 'B12345678',
      serieNumero: 'F2024-00042',
      fecha: new Date('2024-06-15'),
      importe: 121.0,
      isVerifactu: false,
    })
    expect(url).toContain('ValidarQRNoVerifactu')
  })

  it('normalizes NIF by removing spaces and uppercase', () => {
    const url = generateAEATQRUrl({
      nif: 'b-12345678',
      serieNumero: 'F2024-00042',
      fecha: new Date('2024-06-15'),
      importe: 121.0,
    })
    expect(url).toContain('nif=B12345678')
  })

  it('truncates serieNumero to 60 chars', () => {
    const longSerie = 'A'.repeat(80)
    const url = generateAEATQRUrl({
      nif: 'B12345678',
      serieNumero: longSerie,
      fecha: new Date('2024-06-15'),
      importe: 121.0,
    })
    const match = url.match(/numserie=([^&]+)/)
    expect(match?.[1]?.length).toBe(60)
  })

  it('formats importe with 2 decimal places', () => {
    const url = generateAEATQRUrl({
      nif: 'B12345678',
      serieNumero: 'F2024-00042',
      fecha: new Date('2024-06-15'),
      importe: 241.4,
    })
    expect(url).toContain('importe=241.40')
  })

  it('handles large importe correctly', () => {
    const url = generateAEATQRUrl({
      nif: 'B12345678',
      serieNumero: 'F2024-00042',
      fecha: new Date('2024-06-15'),
      importe: 123456789012.34,
    })
    expect(url).toContain('importe=123456789012.34')
  })
})

describe('generateAEATQRUrlFromInvoice', () => {
  it('wraps invoice data correctly', () => {
    const url = generateAEATQRUrlFromInvoice(
      'B12345678',
      'F2024-00042',
      new Date('2024-06-15'),
      121.0,
    )
    expect(url).toContain('nif=B12345678')
    expect(url).toContain('numserie=F2024-00042')
    expect(url).toContain('fecha=15-06-2024')
    expect(url).toContain('importe=121.00')
  })
})
