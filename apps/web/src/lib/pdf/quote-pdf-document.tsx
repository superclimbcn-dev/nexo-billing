import React from 'react'
import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import { styles } from './invoice-pdf-styles'
import { registerPdfFonts } from './invoice-pdf-fonts'
import type { PdfQuoteData } from './quote-pdf-types'

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

function getStatusMeta(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: 'Borrador', color: '#a3a3a3' },
    sent: { label: 'Enviado', color: '#f59e0b' },
    accepted: { label: 'Aceptado', color: '#22c55e' },
    rejected: { label: 'Rechazado', color: '#ef4444' },
    expired: { label: 'Expirado', color: '#737373' },
    converted: { label: 'Convertido', color: '#22c55e' },
  }
  return map[status] ?? { label: status, color: '#a3a3a3' }
}

export function QuotePdfDocument({ data }: { data: PdfQuoteData }) {
  const { tenant, client, quote, lines, vatBreakdown } = data
  const statusMeta = getStatusMeta(quote.status)

  return (
    <Document title={`Presupuesto ${quote.number}`} author={tenant.legalName ?? tenant.name}>
      <Page size="A4" style={[styles.page, { paddingBottom: 80 }]}>
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
              <Text style={styles.headerBrandSub}>Documento comercial</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTypeLabel}>Presupuesto</Text>
            <Text style={styles.docNumber}>{quote.number}</Text>
          </View>
        </View>

        {/* META GRID */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Fecha de emisión</Text>
            <Text style={styles.metaValue}>{formatDateES(quote.issuedAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Válido hasta</Text>
            <Text style={styles.metaValue}>{formatDateES(quote.validUntil)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Estado</Text>
            <Text style={[styles.metaValue, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
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
            <Text style={styles.partyLabel}>Presupuesto para</Text>
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
          <Text style={styles.tableTitle}>Conceptos presupuestados</Text>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>
              Descripción del servicio
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQuantity]}>Cant.</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Precio unit.</Text>
            <Text style={[styles.tableHeaderCell, styles.colVat]}>IVA</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
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
              <Text style={[styles.cellText, styles.colVat]}>{line.vatRate}%</Text>
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
              <Text style={styles.summaryValue}>{formatEuro(quote.subtotal)}</Text>
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
              <Text style={styles.summaryValue}>{formatEuro(quote.vatAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total presupuestado</Text>
              <Text style={styles.totalValue}>{formatEuro(quote.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* NOTES */}
        {quote.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Observaciones</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* TERMS */}
        {quote.termsConditions && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Términos y condiciones</Text>
            <Text style={styles.notesText}>{quote.termsConditions}</Text>
          </View>
        )}

        {/* PUBLIC LINK QR */}
        {data.qrCodeUrl && (
          <View
            style={{
              position: 'absolute',
              bottom: 24,
              left: 40,
              right: 40,
              padding: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: '#f9fafb',
              borderRadius: 6,
              borderTopWidth: 2,
              borderTopColor: '#d4ff3f',
            }}
            fixed
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 8,
                  color: '#525252',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                Presupuesto online
              </Text>
              <Text style={{ fontSize: 7, color: '#a3a3a3', lineHeight: 1.5 }}>
                Este presupuesto no tiene validez fiscal. Escanea el código QR para
                verlo online, descargar el PDF y aceptarlo de forma segura.
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Image src={data.qrCodeUrl} style={{ width: 64, height: 64, objectFit: 'contain' }} />
              <Text style={{ fontSize: 6, color: '#a3a3a3', marginTop: 2, textAlign: 'center' }}>
                Escanea para ver online
              </Text>
            </View>
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
