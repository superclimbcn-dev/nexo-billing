import { StyleSheet } from '@react-pdf/renderer'

const ACCENT = '#d4ff3f'
const ACCENT_DIM = '#a3cc2c'
const TEXT = '#0a0a0a'
const TEXT_DIM = '#525252'
const TEXT_SUBTLE = '#a3a3a3'
const BORDER = '#e5e5e5'
const BG_SUBTLE = '#fafafa'
const BG_DARK = '#1a1a1a'
const WHITE = '#ffffff'

export const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 140,
    paddingHorizontal: 45,
    fontFamily: 'Inter',
    fontSize: 9,
    color: TEXT,
    lineHeight: 1.5,
    backgroundColor: WHITE,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: ACCENT,
  },

  // Header section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 48,
    height: 48,
    backgroundColor: ACCENT,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBoxText: {
    fontSize: 20,
    fontWeight: 700,
    color: TEXT,
  },
  logo: {
    width: 48,
    height: 48,
    objectFit: 'contain',
  },
  headerBrand: {
    justifyContent: 'center',
  },
  headerBrandName: {
    fontSize: 13,
    fontWeight: 700,
    color: TEXT,
    letterSpacing: 0.3,
  },
  headerBrandSub: {
    fontSize: 7,
    color: TEXT_SUBTLE,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docTypeLabel: {
    fontSize: 8,
    color: TEXT_SUBTLE,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  docNumber: {
    fontFamily: 'Lora',
    fontSize: 26,
    fontWeight: 700,
    color: TEXT,
    letterSpacing: -0.5,
  },

  // Meta grid
  metaGrid: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 12,
  },
  metaItem: {
    flex: 1,
    padding: 10,
    backgroundColor: BG_SUBTLE,
    borderRadius: 6,
  },
  metaLabel: {
    fontSize: 7,
    color: TEXT_SUBTLE,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
    fontWeight: 500,
  },
  metaValue: {
    fontSize: 10,
    color: TEXT,
    fontWeight: 600,
  },
  metaValueAccent: {
    fontSize: 10,
    color: ACCENT_DIM,
    fontWeight: 700,
  },

  // Parties
  partiesSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 18,
  },
  partyBox: {
    flex: 1,
    padding: 12,
    backgroundColor: BG_SUBTLE,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
  },
  partyLabel: {
    fontSize: 7,
    color: TEXT_SUBTLE,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    fontWeight: 500,
  },
  partyName: {
    fontSize: 12,
    fontWeight: 700,
    color: TEXT,
    marginBottom: 4,
  },
  partyDetail: {
    fontSize: 9,
    color: TEXT_DIM,
    marginBottom: 2,
  },
  partyDetailMono: {
    fontSize: 9,
    color: TEXT_DIM,
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },

  // Table
  tableSection: {
    marginBottom: 16,
  },
  tableTitle: {
    fontSize: 8,
    color: TEXT_SUBTLE,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    fontWeight: 500,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 1.5,
    borderBottomColor: TEXT,
  },
  tableHeaderCell: {
    fontSize: 8,
    color: TEXT_SUBTLE,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 500,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  colDescription: { flex: 5 },
  colQuantity: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1.3, textAlign: 'right' },
  colVat: { flex: 0.8, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  cellText: {
    fontSize: 9,
    color: TEXT,
  },
  cellTextBold: {
    fontSize: 9,
    color: TEXT,
    fontWeight: 600,
  },

  // Summary
  summaryWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  summaryBox: {
    width: '55%',
    padding: 14,
    backgroundColor: BG_SUBTLE,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: TEXT_DIM,
  },
  summaryValue: {
    fontSize: 9,
    color: TEXT,
    fontWeight: 500,
  },
  summaryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginVertical: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 5,
    borderTopWidth: 2,
    borderTopColor: ACCENT,
  },
  totalLabel: {
    fontSize: 11,
    color: TEXT,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalValue: {
    fontFamily: 'Lora',
    fontSize: 20,
    color: TEXT,
    fontWeight: 700,
  },

  // Notes
  notesSection: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: BG_SUBTLE,
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 8,
    color: TEXT_SUBTLE,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
    fontWeight: 500,
  },
  notesText: {
    fontSize: 9,
    color: TEXT_DIM,
    lineHeight: 1.6,
  },

  // Payment
  paymentSection: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: BG_SUBTLE,
    borderRadius: 6,
  },
  paymentLabel: {
    fontSize: 8,
    color: TEXT_SUBTLE,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
    fontWeight: 500,
  },
  paymentMethod: {
    fontSize: 10,
    color: TEXT,
    fontWeight: 600,
    marginBottom: 4,
  },
  iban: {
    fontSize: 11,
    color: TEXT,
    fontWeight: 500,
    letterSpacing: 1,
    fontFamily: 'Inter',
  },

  // Verifactu placeholder
  verifactuSection: {
    position: 'absolute',
    bottom: 56,
    left: 45,
    right: 45,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderTopWidth: 2,
    borderTopColor: ACCENT,
    borderLeftWidth: 1,
    borderLeftColor: BORDER,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  verifactuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  verifactuBadge: {
    width: 14,
    height: 14,
    backgroundColor: ACCENT,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifactuBadgeText: {
    fontSize: 8,
    fontWeight: 700,
    color: TEXT,
  },
  verifactuTitle: {
    fontSize: 7,
    color: TEXT,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: 600,
  },
  verifactuGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  verifactuCol: {
    flex: 1,
  },
  verifactuLabel: {
    fontSize: 6,
    color: TEXT_SUBTLE,
    marginBottom: 1,
  },
  verifactuValue: {
    fontSize: 7,
    color: TEXT,
    fontFamily: 'Inter',
    fontWeight: 500,
  },
  qrCode: {
    width: 72,
    height: 72,
    objectFit: 'contain',
  },
  qrCodeLabel: {
    fontSize: 6,
    color: TEXT_SUBTLE,
    marginTop: 2,
    textAlign: 'center',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 45,
    right: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  footerText: {
    fontSize: 7,
    color: TEXT_SUBTLE,
  },
  footerBrand: {
    fontSize: 7,
    color: TEXT_SUBTLE,
  },
  footerBrandHighlight: {
    color: ACCENT_DIM,
    fontWeight: 600,
  },
  pageNumber: {
    fontSize: 7,
    color: TEXT_SUBTLE,
  },
})
