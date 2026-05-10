import { describe, it, expect } from 'vitest'
import type { RegistroAlta, RegistroAnulacion } from '../records/types'
import { generateRegistroAltaXml, generateRegistroAnulacionXml, wrapSoapEnvelope } from './templates'

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeAlta(overrides?: Partial<RegistroAlta>): RegistroAlta {
  return {
    idVersionFacturacion: '1.0',
    idFactura: {
      serieFactura: 'F2024',
      numFactura: '00042',
      fechaExpedicionFactura: new Date('2024-06-15'),
    },
    idEmisorFactura: {
      nif: 'B12345678',
      nombreRazon: 'Acme S.L.',
    },
    idReceptor: {
      nif: '12345678Z',
      nombreRazon: 'Cliente Test',
    },
    tipoFactura: 'F1',
    descripcionOperacion: 'Venta de servicios de consultoría',
    importeTotal: 121.0,
    cuotaTotal: 21.0,
    desgloseFactura: [
      {
        sujeta: 'SI',
        noExenta: {
          tipoNoExenta: 'S1',
          desgloseIVA: [
            {
              tipoImpositivo: 21,
              baseImponible: 100,
              cuotaRepercutida: 21,
            },
          ],
        },
      },
    ],
    encadenamiento: {
      registroAnterior: {
        idEmisorFactura: 'B12345678',
        idFactura: {
          serieFactura: 'F2024',
          numFactura: '00041',
        },
        huella:
          'aabbccdd00112233aabbccdd00112233aabbccdd00112233aabbccdd00112233',
      },
    },
    huella:
      'deadbeef00112233deadbeef00112233deadbeef00112233deadbeef00112233',
    tipoHuella: '01',
    fechaHoraHusoGenRegistro: '2024-06-15T10:30:00+02:00',
    ...overrides,
  }
}

function makeAnulacion(overrides?: Partial<RegistroAnulacion>): RegistroAnulacion {
  return {
    idVersionFacturacion: '1.0',
    idFactura: {
      serieFactura: 'F2024',
      numFactura: '00042',
      fechaExpedicionFactura: new Date('2024-06-15'),
    },
    idEmisorFactura: {
      nif: 'B12345678',
      nombreRazon: 'Acme S.L.',
    },
    huella:
      'deadbeef00112233deadbeef00112233deadbeef00112233deadbeef00112233',
    tipoHuella: '01',
    fechaHoraHusoGenRegistro: '2024-06-15T10:35:00+02:00',
    encadenamiento: {
      registroAnterior: {
        idEmisorFactura: 'B12345678',
        idFactura: {
          serieFactura: 'F2024',
          numFactura: '00042',
        },
        huella:
          'aabbccdd00112233aabbccdd00112233aabbccdd00112233aabbccdd00112233',
      },
    },
    ...overrides,
  }
}

// ── RegistroAlta ────────────────────────────────────────────────────────────

describe('generateRegistroAltaXml', () => {
  it('includes the XML declaration', () => {
    const xml = generateRegistroAltaXml(makeAlta())
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>\n/)
  })

  it('includes IDVersionFacturacion', () => {
    const xml = generateRegistroAltaXml(makeAlta())
    expect(xml).toContain('<IDVersionFacturacion>1.0</IDVersionFacturacion>')
  })

  it('formats fechaExpedicionFactura as dd-MM-yyyy', () => {
    const xml = generateRegistroAltaXml(makeAlta())
    expect(xml).toContain('<FechaExpedicionFactura>15-06-2024</FechaExpedicionFactura>')
  })

  it('formats numbers to 2 decimals', () => {
    const xml = generateRegistroAltaXml(makeAlta())
    expect(xml).toContain('<ImporteTotal>121.00</ImporteTotal>')
    expect(xml).toContain('<CuotaTotal>21.00</CuotaTotal>')
    expect(xml).toContain('<BaseImponible>100.00</BaseImponible>')
    expect(xml).toContain('<CuotaRepercutida>21.00</CuotaRepercutida>')
    expect(xml).toContain('<TipoImpositivo>21.00</TipoImpositivo>')
  })

  it('escapes XML special characters in description', () => {
    const xml = generateRegistroAltaXml(
      makeAlta({ descripcionOperacion: 'A & B <C> "D"' }),
    )
    expect(xml).toContain('A &amp; B &lt;C&gt; &quot;D&quot;')
  })

  it('omits IDReceptor when not provided (F2)', () => {
    const xml = generateRegistroAltaXml(makeAlta({ idReceptor: undefined, tipoFactura: 'F2' }))
    expect(xml).not.toContain('<IDReceptor>')
  })

  it('includes IDReceptor when provided', () => {
    const xml = generateRegistroAltaXml(makeAlta())
    expect(xml).toContain('<IDReceptor>')
    expect(xml).toContain('<NIF>12345678Z</NIF>')
    expect(xml).toContain('<NombreRazon>Cliente Test</NombreRazon>')
  })

  it('includes encadenamiento block', () => {
    const xml = generateRegistroAltaXml(makeAlta())
    expect(xml).toContain('<Encadenamiento>')
    expect(xml).toContain('<RegistroAnterior>')
    expect(xml).toContain('<Huella>aabbccdd00112233aabbccdd00112233aabbccdd00112233aabbccdd00112233</Huella>')
  })

  it('includes FechaHoraHusoGenRegistro as-is', () => {
    const xml = generateRegistroAltaXml(makeAlta())
    expect(xml).toContain('<FechaHoraHusoGenRegistro>2024-06-15T10:30:00+02:00</FechaHoraHusoGenRegistro>')
  })

  it('includes datosInmueble when provided', () => {
    const xml = generateRegistroAltaXml(
      makeAlta({
        datosInmueble: {
          situacionInmueble: '1',
          referenciaCatastral: '12345ABC',
        },
      }),
    )
    expect(xml).toContain('<DatosInmueble>')
    expect(xml).toContain('<SituacionInmueble>1</SituacionInmueble>')
    expect(xml).toContain('<ReferenciaCatastral>12345ABC</ReferenciaCatastral>')
  })

  it('omits datosInmueble when not provided', () => {
    const xml = generateRegistroAltaXml(makeAlta())
    expect(xml).not.toContain('<DatosInmueble>')
  })

  it('includes optional importe fields when provided', () => {
    const xml = generateRegistroAltaXml(
      makeAlta({ importeTransmisionSujetoAIVA: 100.5, baseImponibleACoste: 80.0 }),
    )
    expect(xml).toContain('<ImporteTransmisionSujetoAIVA>100.50</ImporteTransmisionSujetoAIVA>')
    expect(xml).toContain('<BaseImponibleACoste>80.00</BaseImponibleACoste>')
  })

  it('omits optional importe fields when not provided', () => {
    const xml = generateRegistroAltaXml(makeAlta())
    expect(xml).not.toContain('<ImporteTransmisionSujetoAIVA>')
    expect(xml).not.toContain('<BaseImponibleACoste>')
  })

  it('handles exenta desglose', () => {
    const xml = generateRegistroAltaXml(
      makeAlta({
        desgloseFactura: [
          {
            sujeta: 'NO',
            exenta: { causaExencion: 'E1' },
          },
        ],
      }),
    )
    expect(xml).toContain('<Sujeta>NO</Sujeta>')
    expect(xml).toContain('<Exenta>')
    expect(xml).toContain('<CausaExencion>E1</CausaExencion>')
    expect(xml).not.toContain('<NoExenta>')
  })
})

// ── RegistroAnulacion ───────────────────────────────────────────────────────

describe('generateRegistroAnulacionXml', () => {
  it('includes the XML declaration', () => {
    const xml = generateRegistroAnulacionXml(makeAnulacion())
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>\n/)
  })

  it('includes core fields', () => {
    const xml = generateRegistroAnulacionXml(makeAnulacion())
    expect(xml).toContain('<RegistroAnulacion>')
    expect(xml).toContain('<IDVersionFacturacion>1.0</IDVersionFacturacion>')
    expect(xml).toContain('<NIF>B12345678</NIF>')
    expect(xml).toContain('<FechaExpedicionFactura>15-06-2024</FechaExpedicionFactura>')
    expect(xml).toContain('<Huella>deadbeef00112233deadbeef00112233deadbeef00112233deadbeef00112233</Huella>')
    expect(xml).toContain('<TipoHuella>01</TipoHuella>')
  })

  it('includes encadenamiento block', () => {
    const xml = generateRegistroAnulacionXml(makeAnulacion())
    expect(xml).toContain('<Encadenamiento>')
    expect(xml).toContain('<RegistroAnterior>')
  })
})

// ── SOAP Envelope ───────────────────────────────────────────────────────────

describe('wrapSoapEnvelope', () => {
  it('wraps body in SOAP envelope', () => {
    const wrapped = wrapSoapEnvelope('<Test/>')
    expect(wrapped).toContain('<soapenv:Envelope')
    expect(wrapped).toContain('<soapenv:Body>')
    expect(wrapped).toContain('<Test/>')
    expect(wrapped).toContain('</soapenv:Envelope>')
  })

  it('includes namespace declarations', () => {
    const wrapped = wrapSoapEnvelope('<Test/>')
    expect(wrapped).toContain('xmlns:soapenv=')
    expect(wrapped).toContain('xmlns:sum=')
  })

  it('indents body content', () => {
    const wrapped = wrapSoapEnvelope('<Line>value</Line>')
    expect(wrapped).toContain('        <Line>value</Line>')
  })
})
