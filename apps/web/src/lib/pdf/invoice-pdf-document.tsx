import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import { styles } from './invoice-pdf-styles'
import { registerPdfFonts } from './invoice-pdf-fonts'
import type { PdfInvoiceData } from './invoice-pdf-types'

registerPdfFonts()

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDateES(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatIban(iban: string): string {
  return iban
    .replace(/\s/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

function getStatusMeta(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    paid: { label: 'Pagada', color: '#22c55e' },
    sent: { label: 'Pendiente', color: '#f59e0b' },
    draft: { label: 'Borrador', color: '#a3a3a3' },
    overdue: { label: 'Vencida', color: '#ef4444' },
    cancelled: { label: 'Anulada', color: '#737373' },
    partially_paid: { label: 'Parcial', color: '#d4ff3f' },
  }
  return map[status] ?? { label: status, color: '#a3a3a3' }
}

function getPaymentMethodLabel(method?: string | null): string {
  const map: Record<string, string> = {
    cash: 'Efectivo',
    bank_transfer: 'Transferencia bancaria',
    card: 'Tarjeta',
    bizum: 'Bizum',
    direct_debit: 'Domiciliación bancaria',
    cheque: 'Cheque',
    other: 'Otro',
  }
  return map[method ?? ''] ?? 'Transferencia bancaria'
}

export function InvoicePdfDocument({ data }: { data: PdfInvoiceData }) {
  const { tenant, client, invoice, lines, vatBreakdown } = data
  const statusMeta = getStatusMeta(invoice.status)
  const isRectificativa = ['R1', 'R2', 'R3', 'R4', 'R5'].includes(invoice.type ?? '')
  const rectTypeLabel =
    invoice.type === 'R1'
      ? 'Error fundado en derecho'
      : invoice.type === 'R2'
        ? 'Devolución de mercancía'
        : invoice.type === 'R3'
          ? 'Descuento posterior'
          : invoice.type === 'R4'
            ? 'Obra por administración'
            : invoice.type === 'R5'
              ? 'Resolución de contrato'
              : ''

  return (
    <Document
      title={`Factura ${invoice.fullNumber}`}
      author={tenant.legalName ?? tenant.name}
    >
      <Page size="A4" style={styles.page}>
        {/* Top accent bar */}
        <View style={styles.topBar} fixed />

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {tenant.logoUrl ? (
              <Image src={tenant.logoUrl} style={styles.logo} />
            ) : (
              <View style={styles.logoBox}>
                <Text style={styles.logoBoxText}>
                  {tenant.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.headerBrand}>
              <Text style={styles.headerBrandName}>
                {tenant.legalName || tenant.name}
              </Text>
              <Text style={styles.headerBrandSub}>
                Documento de facturación
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTypeLabel}>
              {isRectificativa ? 'Rectificativa' : 'Factura'}
            </Text>
            <Text style={styles.docNumber}>{invoice.fullNumber}</Text>
            {isRectificativa && invoice.rectifiedBy && (
              <Text style={styles.docSubNumber}>
                de {invoice.rectifiedBy.fullNumber}
              </Text>
            )}
          </View>
        </View>

        {/* META GRID */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Fecha de emisión</Text>
            <Text style={styles.metaValue}>{formatDateES(invoice.issuedAt)}</Text>
          </View>
          {invoice.dueAt && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Vencimiento</Text>
              <Text style={styles.metaValue}>{formatDateES(invoice.dueAt)}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Estado</Text>
            <Text style={[styles.metaValue, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>VeriFactu</Text>
            <Text style={styles.metaValueAccent}>
              {data.verifactu?.status === 'accepted'
                ? 'Enviada a AEAT'
                : data.verifactu?.status === 'error'
                  ? 'Error en envío'
                  : data.verifactu?.status === 'rejected'
                    ? 'Rechazada'
                    : 'Pendiente de envío'}
            </Text>
          </View>
          {isRectificativa && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Tipo</Text>
              <Text style={styles.metaValueAccent}>
                {invoice.type} — {rectTypeLabel}
              </Text>
            </View>
          )}
        </View>

        {/* PARTIES */}
        <View style={styles.partiesSection}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Emitido por</Text>
            <Text style={styles.partyName}>{tenant.legalName || tenant.name}</Text>
            <Text style={styles.partyDetailMono}>NIF/CIF: {tenant.nif}</Text>
            {tenant.fiscalAddress && (
              <Text style={styles.partyDetail}>{tenant.fiscalAddress}</Text>
            )}
            {(tenant.fiscalPostal || tenant.fiscalCity) && (
              <Text style={styles.partyDetail}>
                {[tenant.fiscalPostal, tenant.fiscalCity, tenant.fiscalProvince]
                  .filter(Boolean)
                  .join(' · ')}
                {tenant.country && tenant.country !== 'ES' ? ` · ${tenant.country}` : ''}
              </Text>
            )}
            {tenant.email && (
              <Text style={styles.partyDetail}>{tenant.email}</Text>
            )}
            {tenant.phone && (
              <Text style={styles.partyDetail}>{tenant.phone}</Text>
            )}
          </View>

          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Facturar a</Text>
            <Text style={styles.partyName}>{client.legalName || client.name}</Text>
            <Text style={styles.partyDetailMono}>NIF/CIF: {client.nif}</Text>
            {client.address && (
              <Text style={styles.partyDetail}>{client.address}</Text>
            )}
            {(client.postalCode || client.city) && (
              <Text style={styles.partyDetail}>
                {[client.postalCode, client.city, client.province]
                  .filter(Boolean)
                  .join(' · ')}
                {client.country && client.country !== 'ES' ? ` · ${client.country}` : ''}
              </Text>
            )}
            {client.email && (
              <Text style={styles.partyDetail}>{client.email}</Text>
            )}
          </View>
        </View>

        {/* TABLE */}
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>Conceptos facturados</Text>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>
              Descripción del servicio
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQuantity]}>
              Cant.
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>
              Precio unit.
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colVat]}>
              IVA
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>
              Total
            </Text>
          </View>
          {lines.map((line, idx) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <Text style={[styles.cellText, styles.colDescription]}>
                {line.description}
              </Text>
              <Text style={[styles.cellText, styles.colQuantity]}>
                {line.quantity % 1 === 0
                  ? line.quantity.toFixed(0)
                  : line.quantity.toFixed(2)}
              </Text>
              <Text style={[styles.cellText, styles.colPrice]}>
                {formatEuro(line.unitPrice)}
              </Text>
              <Text style={[styles.cellText, styles.colVat]}>
                {line.vatRate}%
              </Text>
              <Text style={[styles.cellTextBold, styles.colTotal]}>
                {formatEuro(line.totalAmount)}
              </Text>
            </View>
          ))}
        </View>

        {/* SUMMARY */}
        <View style={styles.summaryWrapper}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal (base imponible)</Text>
              <Text style={styles.summaryValue}>{formatEuro(invoice.subtotal)}</Text>
            </View>
            {vatBreakdown.map((b) => (
              <View key={b.rate} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  IVA {b.rate}% sobre {formatEuro(b.base)}
                </Text>
                <Text style={styles.summaryValue}>{formatEuro(b.amount)}</Text>
              </View>
            ))}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total IVA incluido</Text>
              <Text style={styles.summaryValue}>{formatEuro(invoice.vatAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total a pagar</Text>
              <Text style={styles.totalValue}>{formatEuro(invoice.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* NOTES */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Observaciones</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* RECTIFICATION REASON */}
        {isRectificativa && invoice.rectificationReason && (
          <View style={[styles.notesSection, { backgroundColor: '#fef3c7', borderLeftWidth: 3, borderLeftColor: '#f59e0b' }]}>
            <Text style={styles.notesLabel}>Motivo de la rectificación</Text>
            <Text style={styles.notesText}>{invoice.rectificationReason}</Text>
          </View>
        )}

        {/* PAYMENT */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentLabel}>Forma de pago</Text>
          <Text style={styles.paymentMethod}>
            {getPaymentMethodLabel()}
          </Text>
          {tenant.iban ? (
            <Text style={styles.iban}>IBAN: {formatIban(tenant.iban)}</Text>
          ) : (
            <Text style={styles.paymentMethod}>
              Consultar datos bancarios con el emisor
            </Text>
          )}
        </View>

        {/* VERIFACTU BLOCK */}
        <View style={styles.verifactuSection}>
          <View style={{ flex: 1 }}>
            <View style={styles.verifactuHeader}>
              <View style={styles.verifactuBadge}>
                <Text style={styles.verifactuBadgeText}>V</Text>
              </View>
              <Text style={styles.verifactuTitle}>
                {data.verifactu?.status === 'accepted'
                  ? 'VERI*FACTU · Factura verificable en la sede electrónica de la AEAT'
                  : 'Datos de trazabilidad VeriFactu · Registro de facturación encadenado'}
              </Text>
            </View>
            {data.verifactu?.status === 'accepted' ? (
              <>
                <View style={styles.verifactuGrid}>
                  <View style={styles.verifactuCol}>
                    <Text style={styles.verifactuLabel}>CSV (Código Seguro de Verificación)</Text>
                    <Text style={styles.verifactuValue}>{data.verifactu.csv ?? '—'}</Text>
                  </View>
                  <View style={styles.verifactuCol}>
                    <Text style={styles.verifactuLabel}>Hash criptográfico (SHA-256)</Text>
                    <Text style={styles.verifactuValue}>
                      {data.verifactu.hash
                        ? `${data.verifactu.hash.slice(0, 8)}...${data.verifactu.hash.slice(-8)}`
                        : '—'}
                    </Text>
                  </View>
                  <View style={styles.verifactuCol}>
                    <Text style={styles.verifactuLabel}>Hash registro anterior</Text>
                    <Text style={styles.verifactuValue}>
                      {data.verifactu.previousHash
                        ? `${data.verifactu.previousHash.slice(0, 8)}...${data.verifactu.previousHash.slice(-8)}`
                        : '—'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.verifactuLegalText}>
                  Factura emitida con cumplimiento del art. 4 y ss. del Reglamento RRSIF,
                  mediante sistema informático de facturación autorizado.
                  Puede verificar esta factura escaneando el código QR tributario
                  o accediendo a la sede electrónica de la Agencia Tributaria.
                </Text>
              </>
            ) : (
              <View style={styles.verifactuGrid}>
                <View style={styles.verifactuCol}>
                  <Text style={styles.verifactuLabel}>ID Registro de alta</Text>
                  <Text style={styles.verifactuValue}>
                    RF-A-{invoice.fullNumber.replace(/-/g, '')}-{invoice.issuedAt.getFullYear()}-001
                  </Text>
                </View>
                <View style={styles.verifactuCol}>
                  <Text style={styles.verifactuLabel}>Estado</Text>
                  <Text style={styles.verifactuValue}>
                    {data.verifactu?.status === 'error'
                      ? 'Error en envío'
                      : data.verifactu?.status === 'rejected'
                        ? 'Rechazada'
                        : 'Pendiente de envío'}
                  </Text>
                </View>
              </View>
            )}
          </View>
          {data.aeatQrUrl ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.qrTributarioLabel}>QR tributario</Text>
              {/* QR image is generated externally and passed as qrCodeUrl */}
              {data.qrCodeUrl && (
                <>
                  <Image src={data.qrCodeUrl} style={styles.qrCode} />
                  <Text style={styles.qrCodeLabel}>
                    {data.verifactu?.status === 'accepted'
                      ? 'VERI*FACTU'
                      : 'Escanea para ver online'}
                  </Text>
                </>
              )}
            </View>
          ) : data.qrCodeUrl ? (
            <View style={{ alignItems: 'center' }}>
              <Image src={data.qrCodeUrl} style={styles.qrCode} />
              <Text style={styles.qrCodeLabel}>Escanea para ver online</Text>
            </View>
          ) : null}
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {tenant.legalName ?? tenant.name} · {tenant.nif}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
          <Text style={styles.footerBrand}>
            {'Generado con '}
            <Text style={styles.footerBrandHighlight}>Nexo Billing</Text>
          </Text>
        </View>
      </Page>
    </Document>
  )
}
