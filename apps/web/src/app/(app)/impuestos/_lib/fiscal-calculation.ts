import { Prisma } from '@nexo/prisma'
import { getQuarterDates, getQuarterDeadline, type Quarter } from './impuestos-schema'

type DecimalInput = Prisma.Decimal | string | number

export type FiscalModel = 'modelo303' | 'modelo130'

export type FiscalWarningCode =
  | 'EXPENSE_CANCELLED'
  | 'EXPENSE_FISCAL_PERCENTAGE_INVALID'
  | 'EXPENSE_IRPF_TREATMENT_UNDEFINED'
  | 'EXPENSE_VAT_BREAKDOWN_MISSING'
  | 'EXPENSE_VAT_TREATMENT_UNDEFINED'

export interface FiscalWarning {
  code: FiscalWarningCode
  documentType: 'expense'
  documentId: string
  models: FiscalModel[]
  message: string
}

export type FiscalIgnoredReason =
  | 'cancelled'
  | 'fiscal_percentage_invalid'
  | 'fiscal_treatment_undefined'
  | 'outside_period'
  | 'status_excluded'
  | 'tenant_mismatch'

export interface FiscalIgnoredDocument {
  documentType: 'invoice' | 'expense'
  documentId: string
  models: FiscalModel[]
  reason: FiscalIgnoredReason
}

export interface FiscalInvoiceDocument {
  id: string
  tenantId: string
  issuedAt: Date
  operationAt: Date | null
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'rectified'
  subtotal: DecimalInput
  vatAmount: DecimalInput
}

export interface FiscalExpenseDocument {
  id: string
  tenantId: string
  issuedAt: Date
  status: 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled'
  subtotal: DecimalInput
  vatAmount: DecimalInput
  vatDeductiblePercent: DecimalInput | null
  irpfDeductiblePercent: DecimalInput | null
  hasVatBreakdown: boolean
}

export interface FiscalCalculationInput {
  tenantId: string
  year: number
  quarter: Quarter
  invoices: FiscalInvoiceDocument[]
  expenses: FiscalExpenseDocument[]
  now?: Date
}

export interface FiscalPeriodCalculation {
  period: {
    year: number
    quarter: Quarter
    quarterStart: Date
    yearStart: Date
    end: Date
    deadline: Date
  }
  modelo303: {
    taxableBase: number
    outputVat: number
    supportedVat: number
    deductibleVat: number
    nonDeductibleVat: number
    estimatedResult: number
    status: 'pending' | 'overdue'
  }
  modelo130: {
    grossIncome: number
    deductibleExpenses: number
    netIncome: number
    theoreticalAccruedTax: number
    previousPayments: number | null
    withholdings: number | null
    estimatedPeriodResult: number | null
    estimateBeforeAdjustments: number
    status: 'pending' | 'overdue'
  }
  warnings: FiscalWarning[]
  audit: {
    includedInvoiceIds: {
      modelo303: string[]
      modelo130: string[]
    }
    includedExpenseIds: {
      modelo303Supported: string[]
      modelo303Deductible: string[]
      modelo130Deductible: string[]
    }
    undefinedFiscalExpenseIds: {
      vat: string[]
      irpf: string[]
    }
    ignoredDocuments: FiscalIgnoredDocument[]
  }
}

const ZERO = new Prisma.Decimal(0)
const ONE_HUNDRED = new Prisma.Decimal(100)
const IRPF_RATE = new Prisma.Decimal('0.20')

function decimal(value: DecimalInput): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value)
}

function roundMoney(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
}

function moneyNumber(value: Prisma.Decimal): number {
  return roundMoney(value).toNumber()
}

function addMoney(total: Prisma.Decimal, value: DecimalInput): Prisma.Decimal {
  return total.plus(decimal(value))
}

function percentageAmount(base: DecimalInput, percentage: DecimalInput): Prisma.Decimal {
  return roundMoney(decimal(base).times(decimal(percentage)).dividedBy(ONE_HUNDRED))
}

function isWithin(date: Date, start: Date, end: Date): boolean {
  const timestamp = date.getTime()
  return timestamp >= start.getTime() && timestamp <= end.getTime()
}

function isValidPercentage(value: DecimalInput): boolean {
  const percentage = decimal(value)
  return percentage.greaterThanOrEqualTo(ZERO) && percentage.lessThanOrEqualTo(ONE_HUNDRED)
}

function modelsForDate(date: Date, quarterStart: Date, yearStart: Date, end: Date): FiscalModel[] {
  const models: FiscalModel[] = []
  if (isWithin(date, quarterStart, end)) models.push('modelo303')
  if (isWithin(date, yearStart, end)) models.push('modelo130')
  return models
}

export function calculateFiscalPeriod(input: FiscalCalculationInput): FiscalPeriodCalculation {
  const { tenantId, year, quarter, invoices, expenses } = input
  const { start: quarterStart, end } = getQuarterDates(year, quarter)
  const yearStart = new Date(year, 0, 1)
  const deadline = getQuarterDeadline(year, quarter)
  const now = input.now ?? new Date()

  let taxableBase = ZERO
  let outputVat = ZERO
  let grossIncome = ZERO
  let supportedVat = ZERO
  let deductibleVat = ZERO
  let deductibleExpenses = ZERO

  const warnings: FiscalWarning[] = []
  const ignoredDocuments: FiscalIgnoredDocument[] = []
  const includedInvoiceIds303: string[] = []
  const includedInvoiceIds130: string[] = []
  const includedExpenseIds303Supported: string[] = []
  const includedExpenseIds303Deductible: string[] = []
  const includedExpenseIds130Deductible: string[] = []
  const undefinedVatExpenseIds: string[] = []
  const undefinedIrpfExpenseIds: string[] = []

  for (const invoice of invoices) {
    const fiscalDate = invoice.operationAt ?? invoice.issuedAt
    const models = modelsForDate(fiscalDate, quarterStart, yearStart, end)

    if (invoice.tenantId !== tenantId) {
      ignoredDocuments.push({
        documentType: 'invoice',
        documentId: invoice.id,
        models: models.length > 0 ? models : ['modelo303', 'modelo130'],
        reason: 'tenant_mismatch',
      })
      continue
    }

    if (models.length === 0) {
      ignoredDocuments.push({
        documentType: 'invoice',
        documentId: invoice.id,
        models: ['modelo303', 'modelo130'],
        reason: 'outside_period',
      })
      continue
    }

    if (invoice.status === 'draft' || invoice.status === 'cancelled') {
      ignoredDocuments.push({
        documentType: 'invoice',
        documentId: invoice.id,
        models,
        reason: 'status_excluded',
      })
      continue
    }

    if (models.includes('modelo303')) {
      taxableBase = addMoney(taxableBase, invoice.subtotal)
      outputVat = addMoney(outputVat, invoice.vatAmount)
      includedInvoiceIds303.push(invoice.id)
    }

    if (models.includes('modelo130')) {
      grossIncome = addMoney(grossIncome, invoice.subtotal)
      includedInvoiceIds130.push(invoice.id)
    }
  }

  for (const expense of expenses) {
    const models = modelsForDate(expense.issuedAt, quarterStart, yearStart, end)

    if (expense.tenantId !== tenantId) {
      ignoredDocuments.push({
        documentType: 'expense',
        documentId: expense.id,
        models: models.length > 0 ? models : ['modelo303', 'modelo130'],
        reason: 'tenant_mismatch',
      })
      continue
    }

    if (models.length === 0) {
      ignoredDocuments.push({
        documentType: 'expense',
        documentId: expense.id,
        models: ['modelo303', 'modelo130'],
        reason: 'outside_period',
      })
      continue
    }

    if (expense.status === 'cancelled') {
      ignoredDocuments.push({
        documentType: 'expense',
        documentId: expense.id,
        models,
        reason: 'cancelled',
      })
      warnings.push({
        code: 'EXPENSE_CANCELLED',
        documentType: 'expense',
        documentId: expense.id,
        models,
        message: 'El gasto cancelado se ha excluido del cálculo fiscal.',
      })
      continue
    }

    const affects303 = models.includes('modelo303')
    const affects130 = models.includes('modelo130')

    if (affects303) {
      supportedVat = addMoney(supportedVat, expense.vatAmount)
      includedExpenseIds303Supported.push(expense.id)

      if (!expense.hasVatBreakdown) {
        warnings.push({
          code: 'EXPENSE_VAT_BREAKDOWN_MISSING',
          documentType: 'expense',
          documentId: expense.id,
          models: ['modelo303'],
          message: 'El gasto no tiene un desglose de IVA verificable.',
        })
      }

      if (expense.vatDeductiblePercent === null) {
        undefinedVatExpenseIds.push(expense.id)
        ignoredDocuments.push({
          documentType: 'expense',
          documentId: expense.id,
          models: ['modelo303'],
          reason: 'fiscal_treatment_undefined',
        })
        warnings.push({
          code: 'EXPENSE_VAT_TREATMENT_UNDEFINED',
          documentType: 'expense',
          documentId: expense.id,
          models: ['modelo303'],
          message: 'El gasto no define el porcentaje de IVA deducible.',
        })
      } else if (!isValidPercentage(expense.vatDeductiblePercent)) {
        ignoredDocuments.push({
          documentType: 'expense',
          documentId: expense.id,
          models: ['modelo303'],
          reason: 'fiscal_percentage_invalid',
        })
        warnings.push({
          code: 'EXPENSE_FISCAL_PERCENTAGE_INVALID',
          documentType: 'expense',
          documentId: expense.id,
          models: ['modelo303'],
          message: 'El gasto tiene un porcentaje de IVA deducible no válido.',
        })
      } else {
        deductibleVat = deductibleVat.plus(
          percentageAmount(expense.vatAmount, expense.vatDeductiblePercent),
        )
        includedExpenseIds303Deductible.push(expense.id)
      }
    }

    if (affects130) {
      if (expense.irpfDeductiblePercent === null) {
        undefinedIrpfExpenseIds.push(expense.id)
        ignoredDocuments.push({
          documentType: 'expense',
          documentId: expense.id,
          models: ['modelo130'],
          reason: 'fiscal_treatment_undefined',
        })
        warnings.push({
          code: 'EXPENSE_IRPF_TREATMENT_UNDEFINED',
          documentType: 'expense',
          documentId: expense.id,
          models: ['modelo130'],
          message: 'El gasto no define el porcentaje deducible en IRPF.',
        })
      } else if (!isValidPercentage(expense.irpfDeductiblePercent)) {
        ignoredDocuments.push({
          documentType: 'expense',
          documentId: expense.id,
          models: ['modelo130'],
          reason: 'fiscal_percentage_invalid',
        })
        warnings.push({
          code: 'EXPENSE_FISCAL_PERCENTAGE_INVALID',
          documentType: 'expense',
          documentId: expense.id,
          models: ['modelo130'],
          message: 'El gasto tiene un porcentaje deducible en IRPF no válido.',
        })
      } else {
        // Expense.subtotal is the fiscal base for this estimate. Non-deductible
        // VAT is intentionally not added until the product models that rule.
        deductibleExpenses = deductibleExpenses.plus(
          percentageAmount(expense.subtotal, expense.irpfDeductiblePercent),
        )
        includedExpenseIds130Deductible.push(expense.id)
      }
    }
  }

  taxableBase = roundMoney(taxableBase)
  outputVat = roundMoney(outputVat)
  grossIncome = roundMoney(grossIncome)
  supportedVat = roundMoney(supportedVat)
  deductibleVat = roundMoney(deductibleVat)
  deductibleExpenses = roundMoney(deductibleExpenses)

  const nonDeductibleVat = roundMoney(supportedVat.minus(deductibleVat))
  const modelo303Result = roundMoney(outputVat.minus(deductibleVat))
  const netIncome = roundMoney(grossIncome.minus(deductibleExpenses))
  const theoreticalAccruedTax = netIncome.greaterThan(ZERO)
    ? roundMoney(netIncome.times(IRPF_RATE))
    : ZERO
  const status = now > deadline ? 'overdue' : 'pending'

  return {
    period: {
      year,
      quarter,
      quarterStart,
      yearStart,
      end,
      deadline,
    },
    modelo303: {
      taxableBase: moneyNumber(taxableBase),
      outputVat: moneyNumber(outputVat),
      supportedVat: moneyNumber(supportedVat),
      deductibleVat: moneyNumber(deductibleVat),
      nonDeductibleVat: moneyNumber(nonDeductibleVat),
      estimatedResult: moneyNumber(modelo303Result),
      status,
    },
    modelo130: {
      grossIncome: moneyNumber(grossIncome),
      deductibleExpenses: moneyNumber(deductibleExpenses),
      netIncome: moneyNumber(netIncome),
      theoreticalAccruedTax: moneyNumber(theoreticalAccruedTax),
      previousPayments: null,
      withholdings: null,
      estimatedPeriodResult: null,
      estimateBeforeAdjustments: moneyNumber(theoreticalAccruedTax),
      status,
    },
    warnings,
    audit: {
      includedInvoiceIds: {
        modelo303: includedInvoiceIds303,
        modelo130: includedInvoiceIds130,
      },
      includedExpenseIds: {
        modelo303Supported: includedExpenseIds303Supported,
        modelo303Deductible: includedExpenseIds303Deductible,
        modelo130Deductible: includedExpenseIds130Deductible,
      },
      undefinedFiscalExpenseIds: {
        vat: undefinedVatExpenseIds,
        irpf: undefinedIrpfExpenseIds,
      },
      ignoredDocuments,
    },
  }
}
