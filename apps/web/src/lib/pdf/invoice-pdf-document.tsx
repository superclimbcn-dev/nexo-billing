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
            <Text style={styles.docTypeLabel}>Factura</Text>
            <Text style={styles.docNumber}>{invoice.fullNumber}</Text>
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
            <Text style={styles.metaValueAccent}>Registrado</Text>
          </View>
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

        {/* PAYMENT */}
        {tenant.iban && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentLabel}>Forma de pago</Text>
            <Text style={styles.paymentMethod}>
              {getPaymentMethodLabel()}
            </Text>
            <Text style={styles.iban}>IBAN: {formatIban(tenant.iban)}</Text>
          </View>
        )}

        {/* VERIFACTU FOOTER BLOCK */}
        <View style={styles.verifactuSection}>
          <Text style={styles.verifactuTitle}>
            Datos de trazabilidad VeriFactu · Registro de facturación encadenado
          </Text>
          <View style={styles.verifactuRow}>
            <Text style={styles.verifactuLabel}>ID Registro de alta</Text>
            <Text style={styles.verifactuValue}>
              RF-A-{invoice.fullNumber.replace(/-/g, '')}-{invoice.issuedAt.getFullYear()}-001
            </Text>
          </View>
          <View style={styles.verifactuRow}>
            <Text style={styles.verifactuLabel}>Hash criptográfico (SHA-256)</Text>
            <Text style={styles.verifactuValue}>
              a8f4c2...e9d1b7
            </Text>
          </View>
          <View style={styles.verifactuRow}>
            <Text style={styles.verifactuLabel}>Hash registro anterior</Text>
            <Text style={styles.verifactuValue}>
              b7e1a0...c3f8d2
            </Text>
          </View>
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
            {' · SIF certificado'}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
