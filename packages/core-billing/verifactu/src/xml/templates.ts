import type { RegistroAlta, RegistroAnulacion } from '../records/types'

// ── Helpers ─────────────────────────────────────────────────────────────────

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDateDMY(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}-${m}-${y}`
}

function formatNumber(n: number): string {
  return n.toFixed(2)
}

function optionalNode(tag: string, value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') return ''
  const v = typeof value === 'number' ? formatNumber(value) : escapeXml(String(value))
  return `  <${tag}>${v}</${tag}>\n`
}

function optionalDateNode(tag: string, value: Date | undefined): string {
  if (!value) return ''
  return `  <${tag}>${formatDateDMY(value)}</${tag}>\n`
}

// ── RegistroAlta XML ────────────────────────────────────────────────────────

export function generateRegistroAltaXml(data: RegistroAlta): string {
  const receptorXml = data.idReceptor
    ? `  <IDReceptor>\n` +
      optionalNode('NIF', data.idReceptor.nif) +
      optionalNode('NombreRazon', data.idReceptor.nombreRazon) +
      optionalNode('IDType', data.idReceptor.idType) +
      optionalNode('IDExt', data.idReceptor.idExt) +
      optionalNode('CodigoPais', data.idReceptor.codigoPais) +
      `  </IDReceptor>\n`
    : ''

  const desgloseXml = data.desgloseFactura
    .map((d) => {
      let inner = `    <Sujeta>${d.sujeta}</Sujeta>\n`
      if (d.exenta) {
        inner += `    <Exenta>\n      <CausaExencion>${d.exenta.causaExencion}</CausaExencion>\n    </Exenta>\n`
      }
      if (d.noExenta) {
        const ivaXml = d.noExenta.desgloseIVA
          .map(
            (iva) =>
              `      <DetalleIVA>\n` +
              `        <TipoImpositivo>${formatNumber(iva.tipoImpositivo)}</TipoImpositivo>\n` +
              `        <BaseImponible>${formatNumber(iva.baseImponible)}</BaseImponible>\n` +
              `        <CuotaRepercutida>${formatNumber(iva.cuotaRepercutida)}</CuotaRepercutida>\n` +
              (iva.tipoRecargoEquivalencia !== undefined
                ? `        <TipoRecargoEquivalencia>${formatNumber(iva.tipoRecargoEquivalencia)}</TipoRecargoEquivalencia>\n`
                : '') +
              (iva.cuotaRecargoEquivalencia !== undefined
                ? `        <CuotaRecargoEquivalencia>${formatNumber(iva.cuotaRecargoEquivalencia)}</CuotaRecargoEquivalencia>\n`
                : '') +
              `      </DetalleIVA>\n`,
          )
          .join('')
        inner += `    <NoExenta>\n      <TipoNoExenta>${d.noExenta.tipoNoExenta}</TipoNoExenta>\n      <DesgloseIVA>\n${ivaXml}      </DesgloseIVA>\n    </NoExenta>\n`
      }
      return `  <DesgloseFactura>\n${inner}  </DesgloseFactura>\n`
    })
    .join('')

  const datosInmuebleXml = data.datosInmueble
    ? `  <DatosInmueble>\n` +
      `    <SituacionInmueble>${escapeXml(data.datosInmueble.situacionInmueble)}</SituacionInmueble>\n` +
      optionalNode('ReferenciaCatastral', data.datosInmueble.referenciaCatastral) +
      `  </DatosInmueble>\n`
    : ''

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<RegistroAlta>\n` +
    `  <IDVersionFacturacion>${data.idVersionFacturacion}</IDVersionFacturacion>\n` +
    `  <IDFactura>\n` +
    `    <SerieFactura>${escapeXml(data.idFactura.serieFactura)}</SerieFactura>\n` +
    `    <NumFactura>${escapeXml(data.idFactura.numFactura)}</NumFactura>\n` +
    `    <FechaExpedicionFactura>${formatDateDMY(data.idFactura.fechaExpedicionFactura)}</FechaExpedicionFactura>\n` +
    `  </IDFactura>\n` +
    `  <IDEmisorFactura>\n` +
    `    <NIF>${escapeXml(data.idEmisorFactura.nif)}</NIF>\n` +
    `    <NombreRazon>${escapeXml(data.idEmisorFactura.nombreRazon)}</NombreRazon>\n` +
    `  </IDEmisorFactura>\n` +
    receptorXml +
    `  <TipoFactura>${data.tipoFactura}</TipoFactura>\n` +
    `  <DescripcionOperacion>${escapeXml(data.descripcionOperacion)}</DescripcionOperacion>\n` +
    datosInmuebleXml +
    `  <ImporteTotal>${formatNumber(data.importeTotal)}</ImporteTotal>\n` +
    optionalNode('ImporteTransmisionSujetoAIVA', data.importeTransmisionSujetoAIVA) +
    optionalNode('BaseImponibleACoste', data.baseImponibleACoste) +
    `  <DesgloseFactura>\n${desgloseXml}  </DesgloseFactura>\n` +
    optionalDateNode('FechaOperacion', data.fechaOperacion) +
    `  <CuotaTotal>${formatNumber(data.cuotaTotal)}</CuotaTotal>\n` +
    `  <Encadenamiento>\n` +
    `    <RegistroAnterior>\n` +
    `      <IDEmisorFactura>\n` +
    `        <NIF>${escapeXml(data.encadenamiento.registroAnterior.idEmisorFactura)}</NIF>\n` +
    `      </IDEmisorFactura>\n` +
    `      <IDFactura>\n` +
    `        <SerieFactura>${escapeXml(data.encadenamiento.registroAnterior.idFactura.serieFactura)}</SerieFactura>\n` +
    `        <NumFactura>${escapeXml(data.encadenamiento.registroAnterior.idFactura.numFactura)}</NumFactura>\n` +
    `      </IDFactura>\n` +
    `      <Huella>${data.encadenamiento.registroAnterior.huella}</Huella>\n` +
    `    </RegistroAnterior>\n` +
    `  </Encadenamiento>\n` +
    `  <Huella>${data.huella}</Huella>\n` +
    `  <TipoHuella>${data.tipoHuella}</TipoHuella>\n` +
    `  <FechaHoraHusoGenRegistro>${data.fechaHoraHusoGenRegistro}</FechaHoraHusoGenRegistro>\n` +
    `</RegistroAlta>\n`
  )
}

// ── RegistroAnulacion XML ───────────────────────────────────────────────────

export function generateRegistroAnulacionXml(data: RegistroAnulacion): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<RegistroAnulacion>\n` +
    `  <IDVersionFacturacion>${data.idVersionFacturacion}</IDVersionFacturacion>\n` +
    `  <IDFactura>\n` +
    `    <SerieFactura>${escapeXml(data.idFactura.serieFactura)}</SerieFactura>\n` +
    `    <NumFactura>${escapeXml(data.idFactura.numFactura)}</NumFactura>\n` +
    `    <FechaExpedicionFactura>${formatDateDMY(data.idFactura.fechaExpedicionFactura)}</FechaExpedicionFactura>\n` +
    `  </IDFactura>\n` +
    `  <IDEmisorFactura>\n` +
    `    <NIF>${escapeXml(data.idEmisorFactura.nif)}</NIF>\n` +
    `    <NombreRazon>${escapeXml(data.idEmisorFactura.nombreRazon)}</NombreRazon>\n` +
    `  </IDEmisorFactura>\n` +
    `  <Huella>${data.huella}</Huella>\n` +
    `  <TipoHuella>${data.tipoHuella}</TipoHuella>\n` +
    `  <FechaHoraHusoGenRegistro>${data.fechaHoraHusoGenRegistro}</FechaHoraHusoGenRegistro>\n` +
    `  <Encadenamiento>\n` +
    `    <RegistroAnterior>\n` +
    `      <IDEmisorFactura>\n` +
    `        <NIF>${escapeXml(data.encadenamiento.registroAnterior.idEmisorFactura)}</NIF>\n` +
    `      </IDEmisorFactura>\n` +
    `      <IDFactura>\n` +
    `        <SerieFactura>${escapeXml(data.encadenamiento.registroAnterior.idFactura.serieFactura)}</SerieFactura>\n` +
    `        <NumFactura>${escapeXml(data.encadenamiento.registroAnterior.idFactura.numFactura)}</NumFactura>\n` +
    `      </IDFactura>\n` +
    `      <Huella>${data.encadenamiento.registroAnterior.huella}</Huella>\n` +
    `    </RegistroAnterior>\n` +
    `  </Encadenamiento>\n` +
    `</RegistroAnulacion>\n`
  )
}

// ── SOAP Envelope ───────────────────────────────────────────────────────────

const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/'
const SUM_NS = 'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroLR.xsd'

export function wrapSoapEnvelope(bodyXml: string): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<soapenv:Envelope xmlns:soapenv="${SOAP_NS}" xmlns:sum="${SUM_NS}">\n` +
    `  <soapenv:Header/>\n` +
    `  <soapenv:Body>\n` +
    `    <sum:RegFactuSistemaFacturacion>\n` +
    `      <sum:Cabecera>\n` +
    `        <sum:IDVersionSuministro>1.0</sum:IDVersionSuministro>\n` +
    `      </sum:Cabecera>\n` +
    `      <sum:RegistroFactura>\n` +
    bodyXml
      .split('\n')
      .map((line) => (line.trim() ? '        ' + line : ''))
      .join('\n') +
    `\n      </sum:RegistroFactura>\n` +
    `    </sum:RegFactuSistemaFacturacion>\n` +
    `  </soapenv:Body>\n` +
    `</soapenv:Envelope>\n`
  )
}
