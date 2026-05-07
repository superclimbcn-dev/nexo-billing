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

function getStatusLabel(status: string): string | null {
  const labels: Record<string, string> = {
    paid: 'Pagada',
    sent: 'Emitida',
    overdue: 'Vencida',
    cancelled: 'Anulada',
    partially_paid: 'Pago parcial',
  }
  return labels[status] ?? null
}

export function InvoicePdfDocument({ data }: { data: PdfInvoiceData }) {
  const { tenant, client, invoice, lines, vatBreakdown } = data
  const statusLabel = getStatusLabel(invoice.status)

  return (
    <Document
      title={`Factura ${invoice.fullNumber}`}
      author={tenant.legalName ?? tenant.name}
    >
      <Page size="A4" style={styles.page}>
        {/* Accent bar at top */}
        <View style={styles.accentBar} fixed />

        {/* HEADER: Logo + Invoice number */}
        <View style={styles.headerRow}>
          <View style={styles.logoContainer}>
            {tenant.logoUrl ? (
              <Image src={tenant.logoUrl} style={styles.logo} />
            ) : (
              <Text style={styles.logoFallbackText}>{tenant.name}</Text>
            )}
          </View>
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceTitleLabel}>Factura</Text>
            <Text style={styles.invoiceNumber}>{invoice.fullNumber}</Text>
            {statusLabel && (
              <Text style={styles.statusBadge}>{statusLabel}</Text>
            )}
          </View>
        </View>

        {/* PARTIES: Issuer + Client */}
        <View style={styles.partiesRow}>
          <View style={[styles.party, styles.partyLeft]}>
            <Text style={styles.partyLabel}>Emitido por</Text>
            <Text style={styles.partyName}>{tenant.legalName || tenant.name}</Text>
            <Text style={styles.partyDetail}>CIF: {tenant.nif}</Text>
            {tenant.fiscalAddress && (
              <Text style={styles.partyDetail}>{tenant.fiscalAddress}</Text>
            )}
            {(tenant.fiscalPostal || tenant.fiscalCity) && (
              <Text style={styles.partyDetail}>
                {[tenant.fiscalPostal, tenant.fiscalCity, tenant.fiscalProvince]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            )}
            {tenant.email && (
              <Text style={styles.partyDetail}>{tenant.email}</Text>
            )}
            {tenant.phone && (
              <Text style={styles.partyDetail}>{tenant.phone}</Text>
            )}
          </View>

          <View style={styles.party}>
            <Text style={styles.partyLabel}>Facturar a</Text>
            <Text style={styles.partyName}>{client.legalName || client.name}</Text>
            <Text style={styles.partyDetail}>CIF: {client.nif}</Text>
            {client.address && (
              <Text style={styles.partyDetail}>{client.address}</Text>
            )}
            {(client.postalCode || client.city) && (
              <Text style={styles.partyDetail}>
                {[client.postalCode, client.city, client.province]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            )}
            {client.email && (
              <Text style={styles.partyDetail}>{client.email}</Text>
            )}
          </View>
        </View>

        {/* DATES */}
        <View style={styles.datesRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Fecha de emisión</Text>
            <Text style={styles.dateValue}>{formatDateES(invoice.issuedAt)}</Text>
          </View>
          {invoice.dueAt && (
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Fecha de vencimiento</Text>
              <Text style={styles.dateValue}>{formatDateES(invoice.dueAt)}</Text>
            </View>
          )}
        </View>

        {/* LINE TABLE */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>
              Descripción
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQuantity]}>
              Cant.
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>
              Precio
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
              <Text style={[styles.cellText, styles.colTotal]}>
                {formatEuro(line.totalAmount)}
              </Text>
            </View>
          ))}
        </View>

        {/* SUMMARY */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatEuro(invoice.subtotal)}</Text>
            </View>
            <View style={styles.summaryDivider} />
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
              <Text style={styles.summaryLabel}>Total IVA</Text>
              <Text style={styles.summaryValue}>{formatEuro(invoice.vatAmount)}</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatEuro(invoice.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* OBSERVATIONS — only if notes exist */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Observaciones</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* PAYMENT — only if IBAN exists */}
        {tenant.iban && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentLabel}>Forma de pago</Text>
            <Text style={styles.paymentMethod}>Transferencia bancaria</Text>
            <Text style={styles.iban}>IBAN: {formatIban(tenant.iban)}</Text>
          </View>
        )}

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
