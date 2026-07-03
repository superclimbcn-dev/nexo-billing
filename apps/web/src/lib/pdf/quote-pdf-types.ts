export interface PdfQuoteData {
  tenant: {
    name: string
    legalName: string | null
    nif: string
    fiscalAddress: string | null
    fiscalCity: string | null
    fiscalPostal: string | null
    fiscalProvince: string | null
    country: string
    email: string | null
    phone: string | null
    websiteUrl: string | null
    logoUrl: string | null
  }
  client: {
    name: string
    legalName: string | null
    nif: string
    address: string | null
    city: string | null
    postalCode: string | null
    province: string | null
    country: string
    email: string | null
  }
  quote: {
    number: string
    issuedAt: Date
    validUntil: Date
    notes: string | null
    termsConditions: string | null
    status: string
    subtotal: number
    vatAmount: number
    totalAmount: number
  }
  lines: Array<{
    description: string
    quantity: number
    unitPrice: number
    vatRate: number
    subtotal: number
    vatAmount: number
    totalAmount: number
  }>
  vatBreakdown: Array<{
    rate: number
    base: number
    amount: number
  }>
  qrCodeUrl?: string
}
