import { StyleSheet } from '@react-pdf/renderer'

const ACCENT = '#a3e635'
const ACCENT_DIM = '#84cc16'
const TEXT = '#0a0a0a'
const TEXT_DIM = '#525252'
const TEXT_SUBTLE = '#a3a3a3'
const BORDER = '#e5e5e5'
const BG_SUBTLE = '#fafafa'

export const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 70,
    paddingHorizontal: 50,
    fontFamily: 'Inter',
    fontSize: 9,
    color: TEXT,
    lineHeight: 1.5,
  },

  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: ACCENT,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  logoFallbackText: {
    fontSize: 14,
    fontWeight: 700,
    color: TEXT,
  },
  invoiceTitle: {
    textAlign: 'right',
  },
  invoiceTitleLabel: {
    fontSize: 9,
    color: TEXT_SUBTLE,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontFamily: 'Lora',
    fontSize: 22,
    fontWeight: 700,
    color: TEXT,
  },
  statusBadge: {
    marginTop: 6,
    fontSize: 8,
    color: ACCENT_DIM,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 500,
  },

  partiesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  partyLeft: {
    flex: 1,
    marginRight: 30,
  },
  party: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 8,
    color: TEXT_SUBTLE,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
    fontWeight: 500,
  },
  partyName: {
    fontSize: 11,
    fontWeight: 700,
    color: TEXT,
    marginBottom: 2,
  },
  partyDetail: {
    fontSize: 9,
    color: TEXT_DIM,
    marginBottom: 1,
  },

  datesRow: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 30,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 8,
    color: TEXT_SUBTLE,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 10,
    color: TEXT,
    fontWeight: 500,
  },

  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
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
    paddingVertical: 10,
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

  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  summaryBox: {
    width: '50%',
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
  },
  summaryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginVertical: 4,
  },
  totalBox: {
    backgroundColor: BG_SUBTLE,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    color: TEXT,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalValue: {
    fontFamily: 'Lora',
    fontSize: 18,
    color: TEXT,
    fontWeight: 700,
  },

  notesSection: {
    marginTop: 20,
    marginBottom: 20,
    padding: 12,
    backgroundColor: BG_SUBTLE,
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 8,
    color: TEXT_SUBTLE,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
    fontWeight: 500,
  },
  notesText: {
    fontSize: 9,
    color: TEXT_DIM,
    lineHeight: 1.6,
  },

  paymentSection: {
    marginTop: 20,
    marginBottom: 20,
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
    fontSize: 9,
    color: TEXT,
    marginBottom: 2,
  },
  iban: {
    fontSize: 10,
    color: TEXT,
    fontWeight: 500,
    letterSpacing: 1,
  },

  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
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
    fontWeight: 500,
  },
  pageNumber: {
    fontSize: 7,
    color: TEXT_SUBTLE,
  },
})
