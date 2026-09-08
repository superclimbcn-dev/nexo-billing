import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  calculateFiscalPeriod,
  type FiscalExpenseDocument,
  type FiscalInvoiceDocument,
} from './fiscal-calculation'
import { getQuarterDeadline, type Quarter } from './impuestos-schema'

const TENANT_ID = 'tenant-a'

function date(month: number, day = 15, year = 2026): Date {
  return new Date(year, month, day, 12)
}

function invoice({
  id,
  issuedAt,
  operationAt = null,
  subtotal,
  vatAmount,
  status = 'sent',
  tenantId = TENANT_ID,
}: {
  id: string
  issuedAt: Date
  operationAt?: Date | null
  subtotal: number | string
  vatAmount: number | string
  status?: FiscalInvoiceDocument['status']
  tenantId?: string
}): FiscalInvoiceDocument {
  return { id, tenantId, issuedAt, operationAt, status, subtotal, vatAmount }
}

function expense({
  id,
  issuedAt,
  subtotal,
  vatAmount,
  vatDeductiblePercent,
  irpfDeductiblePercent,
  status = 'paid',
  tenantId = TENANT_ID,
  hasVatBreakdown = true,
}: {
  id: string
  issuedAt: Date
  subtotal: number | string
  vatAmount: number | string
  vatDeductiblePercent: number | string | null
  irpfDeductiblePercent: number | string | null
  status?: FiscalExpenseDocument['status']
  tenantId?: string
  hasVatBreakdown?: boolean
}): FiscalExpenseDocument {
  return {
    id,
    tenantId,
    issuedAt,
    status,
    subtotal,
    vatAmount,
    vatDeductiblePercent,
    irpfDeductiblePercent,
    hasVatBreakdown,
  }
}

function calculate({
  quarter = 'Q1',
  invoices = [],
  expenses = [],
  year = 2026,
  now,
}: {
  quarter?: Quarter
  invoices?: FiscalInvoiceDocument[]
  expenses?: FiscalExpenseDocument[]
  year?: number
  now?: Date
}) {
  return calculateFiscalPeriod({
    tenantId: TENANT_ID,
    year,
    quarter,
    invoices,
    expenses,
    now: now ?? date(0, 1, year),
  })
}

describe('Modelo 303', () => {
  const cases = [
    { percentage: 100, deductible: 21, result: 79 },
    { percentage: 50, deductible: 10.5, result: 89.5 },
    { percentage: 0, deductible: 0, result: 100 },
    { percentage: null, deductible: 0, result: 100 },
  ] as const

  for (const testCase of cases) {
    it(`applies ${String(testCase.percentage)}% VAT deductibility`, () => {
      const calculation = calculate({
        invoices: [
          invoice({
            id: 'invoice',
            issuedAt: date(1),
            subtotal: 500,
            vatAmount: 100,
          }),
        ],
        expenses: [
          expense({
            id: 'expense',
            issuedAt: date(1),
            subtotal: 100,
            vatAmount: 21,
            vatDeductiblePercent: testCase.percentage,
            irpfDeductiblePercent: 100,
          }),
        ],
      })

      assert.equal(calculation.modelo303.supportedVat, 21)
      assert.equal(calculation.modelo303.deductibleVat, testCase.deductible)
      assert.equal(calculation.modelo303.estimatedResult, testCase.result)

      const undefinedWarning = calculation.warnings.find(
        (warning) => warning.code === 'EXPENSE_VAT_TREATMENT_UNDEFINED',
      )
      assert.equal(undefinedWarning !== undefined, testCase.percentage === null)
    })
  }

  it('uses the operation date as the fiscal date for a simplified invoice', () => {
    const calculation = calculate({
      year: 2026,
      quarter: 'Q4',
      invoices: [
        invoice({
          id: 'f2-operation-date',
          issuedAt: date(0, 1, 2027),
          operationAt: date(11, 31, 2026),
          subtotal: '99.17',
          vatAmount: '20.83',
          status: 'paid',
        }),
      ],
    })

    assert.equal(calculation.modelo303.taxableBase, 99.17)
    assert.equal(calculation.modelo303.outputVat, 20.83)
    assert.equal(calculation.modelo130.grossIncome, 99.17)
    assert.deepEqual(calculation.audit.includedInvoiceIds.modelo303, ['f2-operation-date'])
    assert.deepEqual(calculation.audit.includedInvoiceIds.modelo130, ['f2-operation-date'])
  })

  it('handles multiple expenses, materialized multi-rate invoice totals, and excluded statuses', () => {
    const multiRateLines = [
      { subtotal: 100, vatRate: 21, vatAmount: 21 },
      { subtotal: 100, vatRate: 10, vatAmount: 10 },
    ]
    const multiRateSubtotal = multiRateLines.reduce((total, line) => total + line.subtotal, 0)
    const multiRateVat = multiRateLines.reduce((total, line) => total + line.vatAmount, 0)

    assert.equal(new Set(multiRateLines.map((line) => line.vatRate)).size, 2)

    const calculation = calculate({
      invoices: [
        invoice({
          id: 'multi-rate',
          issuedAt: date(1),
          subtotal: multiRateSubtotal,
          vatAmount: multiRateVat,
        }),
        invoice({
          id: 'second-valid',
          issuedAt: date(2),
          subtotal: 50,
          vatAmount: 5,
          status: 'rectified',
        }),
        invoice({
          id: 'draft',
          issuedAt: date(1),
          subtotal: 1000,
          vatAmount: 100,
          status: 'draft',
        }),
        invoice({
          id: 'cancelled',
          issuedAt: date(1),
          subtotal: 1000,
          vatAmount: 100,
          status: 'cancelled',
        }),
      ],
      expenses: [
        expense({
          id: 'full',
          issuedAt: date(1),
          subtotal: 100,
          vatAmount: 21,
          vatDeductiblePercent: 100,
          irpfDeductiblePercent: 100,
        }),
        expense({
          id: 'half',
          issuedAt: date(1),
          subtotal: 100,
          vatAmount: 10,
          vatDeductiblePercent: 50,
          irpfDeductiblePercent: 100,
        }),
        expense({
          id: 'zero',
          issuedAt: date(1),
          subtotal: 100,
          vatAmount: 4,
          vatDeductiblePercent: 0,
          irpfDeductiblePercent: 100,
        }),
      ],
    })

    assert.equal(calculation.modelo303.taxableBase, 250)
    assert.equal(calculation.modelo303.outputVat, 36)
    assert.equal(calculation.modelo303.supportedVat, 35)
    assert.equal(calculation.modelo303.deductibleVat, 26)
    assert.equal(calculation.modelo303.nonDeductibleVat, 9)
    assert.equal(calculation.modelo303.estimatedResult, 10)
    assert.deepEqual(calculation.audit.includedInvoiceIds.modelo303, ['multi-rate', 'second-valid'])
    assert.deepEqual(
      calculation.audit.ignoredDocuments
        .filter((document) => document.documentType === 'invoice')
        .map((document) => document.documentId),
      ['draft', 'cancelled'],
    )
  })

  it('returns zeroes for a quarter without movements', () => {
    const calculation = calculate({ quarter: 'Q2' })

    assert.deepEqual(calculation.modelo303, {
      taxableBase: 0,
      outputVat: 0,
      supportedVat: 0,
      deductibleVat: 0,
      nonDeductibleVat: 0,
      estimatedResult: 0,
      status: 'pending',
    })
    assert.deepEqual(calculation.warnings, [])
  })

  it('rounds each deductible VAT amount to cents before summing', () => {
    const calculation = calculate({
      expenses: [
        expense({
          id: 'rounding-a',
          issuedAt: date(1),
          subtotal: 10,
          vatAmount: '3.47',
          vatDeductiblePercent: 50,
          irpfDeductiblePercent: 100,
        }),
        expense({
          id: 'rounding-b',
          issuedAt: date(1),
          subtotal: 10,
          vatAmount: '3.47',
          vatDeductiblePercent: 50,
          irpfDeductiblePercent: 100,
        }),
      ],
    })

    assert.equal(calculation.modelo303.supportedVat, 6.94)
    assert.equal(calculation.modelo303.deductibleVat, 3.48)
    assert.equal(calculation.modelo303.nonDeductibleVat, 3.46)
    assert.equal(calculation.modelo303.estimatedResult, -3.48)
    assert.ok(calculation.modelo303.deductibleVat <= calculation.modelo303.supportedVat)
  })

  it('keeps a 20 euro expense at its persisted VAT amounts', () => {
    const calculation = calculate({
      expenses: [
        expense({
          id: 'twenty-euro-expense',
          issuedAt: date(1),
          subtotal: 16.53,
          vatAmount: 3.47,
          vatDeductiblePercent: 50,
          irpfDeductiblePercent: 100,
        }),
      ],
    })

    assert.equal(calculation.modelo303.supportedVat, 3.47)
    assert.equal(calculation.modelo303.deductibleVat, 1.74)
  })
})

describe('Modelo 130', () => {
  it('uses accumulated year-to-date values for the Q3 example', () => {
    const calculation = calculate({
      quarter: 'Q3',
      invoices: [
        invoice({ id: 'q1', issuedAt: date(1), subtotal: 1000, vatAmount: 0 }),
        invoice({ id: 'q2', issuedAt: date(4), subtotal: 2000, vatAmount: 0 }),
        invoice({ id: 'q3', issuedAt: date(7), subtotal: 3000, vatAmount: 0 }),
        invoice({ id: 'q4', issuedAt: date(10), subtotal: 4000, vatAmount: 0 }),
      ],
      expenses: [
        expense({
          id: 'expense-q1',
          issuedAt: date(1),
          subtotal: 100,
          vatAmount: 21,
          vatDeductiblePercent: 100,
          irpfDeductiblePercent: 100,
        }),
        expense({
          id: 'expense-q2',
          issuedAt: date(4),
          subtotal: 200,
          vatAmount: 42,
          vatDeductiblePercent: 100,
          irpfDeductiblePercent: 50,
        }),
        expense({
          id: 'expense-q3',
          issuedAt: date(7),
          subtotal: 300,
          vatAmount: 63,
          vatDeductiblePercent: 100,
          irpfDeductiblePercent: 0,
        }),
      ],
    })

    assert.equal(calculation.modelo130.grossIncome, 6000)
    assert.equal(calculation.modelo130.deductibleExpenses, 200)
    assert.equal(calculation.modelo130.netIncome, 5800)
    assert.equal(calculation.modelo130.theoreticalAccruedTax, 1160)
    assert.equal(calculation.modelo303.taxableBase, 3000)
    assert.equal(calculation.modelo130.previousPayments, null)
    assert.equal(calculation.modelo130.withholdings, null)
    assert.equal(calculation.modelo130.estimatedPeriodResult, null)
  })

  it('accumulates independently through Q1, Q2, Q3, and Q4', () => {
    const invoices = [
      invoice({ id: 'q1', issuedAt: date(1), subtotal: 100, vatAmount: 0 }),
      invoice({ id: 'q2', issuedAt: date(4), subtotal: 200, vatAmount: 0 }),
      invoice({ id: 'q3', issuedAt: date(7), subtotal: 300, vatAmount: 0 }),
      invoice({ id: 'q4', issuedAt: date(10), subtotal: 400, vatAmount: 0 }),
    ]
    const expectations: Array<{
      quarter: Quarter
      grossIncome: number
      tax: number
    }> = [
      { quarter: 'Q1', grossIncome: 100, tax: 20 },
      { quarter: 'Q2', grossIncome: 300, tax: 60 },
      { quarter: 'Q3', grossIncome: 600, tax: 120 },
      { quarter: 'Q4', grossIncome: 1000, tax: 200 },
    ]

    for (const expectation of expectations) {
      const calculation = calculate({
        quarter: expectation.quarter,
        invoices,
      })
      assert.equal(calculation.modelo130.grossIncome, expectation.grossIncome)
      assert.equal(calculation.modelo130.theoreticalAccruedTax, expectation.tax)
    }
  })

  it('does not carry documents across fiscal years', () => {
    const calculation = calculate({
      quarter: 'Q4',
      year: 2026,
      invoices: [
        invoice({
          id: 'previous-year',
          issuedAt: date(11, 15, 2025),
          subtotal: 500,
          vatAmount: 0,
        }),
        invoice({
          id: 'current-year',
          issuedAt: date(0, 15, 2026),
          subtotal: 100,
          vatAmount: 0,
        }),
        invoice({
          id: 'next-year',
          issuedAt: date(0, 15, 2027),
          subtotal: 700,
          vatAmount: 0,
        }),
      ],
    })

    assert.equal(calculation.modelo130.grossIncome, 100)
    assert.deepEqual(calculation.audit.includedInvoiceIds.modelo130, ['current-year'])
  })

  it('limits theoretical tax to zero when accumulated net income is negative', () => {
    const calculation = calculate({
      invoices: [
        invoice({
          id: 'income',
          issuedAt: date(1),
          subtotal: 100,
          vatAmount: 21,
        }),
      ],
      expenses: [
        expense({
          id: 'expense',
          issuedAt: date(1),
          subtotal: 200,
          vatAmount: 42,
          vatDeductiblePercent: 100,
          irpfDeductiblePercent: 100,
        }),
      ],
    })

    assert.equal(calculation.modelo130.netIncome, -100)
    assert.equal(calculation.modelo130.theoreticalAccruedTax, 0)
  })

  it('applies 0%, 50%, and 100% and excludes undefined IRPF treatment', () => {
    const calculation = calculate({
      expenses: [
        expense({
          id: 'zero',
          issuedAt: date(1),
          subtotal: 100,
          vatAmount: 21,
          vatDeductiblePercent: 100,
          irpfDeductiblePercent: 0,
        }),
        expense({
          id: 'half',
          issuedAt: date(1),
          subtotal: 100,
          vatAmount: 21,
          vatDeductiblePercent: 100,
          irpfDeductiblePercent: 50,
        }),
        expense({
          id: 'full',
          issuedAt: date(1),
          subtotal: 100,
          vatAmount: 21,
          vatDeductiblePercent: 100,
          irpfDeductiblePercent: 100,
        }),
        expense({
          id: 'undefined',
          issuedAt: date(1),
          subtotal: 1000,
          vatAmount: 210,
          vatDeductiblePercent: 100,
          irpfDeductiblePercent: null,
        }),
      ],
    })

    assert.equal(calculation.modelo130.deductibleExpenses, 150)
    assert.deepEqual(calculation.audit.includedExpenseIds.modelo130Deductible, [
      'zero',
      'half',
      'full',
    ])
    assert.deepEqual(calculation.audit.undefinedFiscalExpenseIds.irpf, ['undefined'])
    assert.ok(
      calculation.warnings.some(
        (warning) =>
          warning.code === 'EXPENSE_IRPF_TREATMENT_UNDEFINED' && warning.documentId === 'undefined',
      ),
    )
  })

  it('keeps tenant isolation as defense in depth', () => {
    const calculation = calculate({
      invoices: [
        invoice({
          id: 'local-invoice',
          issuedAt: date(1),
          subtotal: 100,
          vatAmount: 21,
        }),
        invoice({
          id: 'foreign-invoice',
          tenantId: 'tenant-b',
          issuedAt: date(1),
          subtotal: 900,
          vatAmount: 189,
        }),
      ],
      expenses: [
        expense({
          id: 'local-expense',
          issuedAt: date(1),
          subtotal: 10,
          vatAmount: 2.1,
          vatDeductiblePercent: 100,
          irpfDeductiblePercent: 100,
        }),
        expense({
          id: 'foreign-expense',
          tenantId: 'tenant-b',
          issuedAt: date(1),
          subtotal: 500,
          vatAmount: 105,
          vatDeductiblePercent: 100,
          irpfDeductiblePercent: 100,
        }),
      ],
    })

    assert.equal(calculation.modelo130.grossIncome, 100)
    assert.equal(calculation.modelo130.deductibleExpenses, 10)
    assert.deepEqual(
      calculation.audit.ignoredDocuments
        .filter((document) => document.reason === 'tenant_mismatch')
        .map((document) => document.documentId),
      ['foreign-invoice', 'foreign-expense'],
    )
  })
})

describe('Fiscal warnings and deadlines', () => {
  it('handles a legacy expense without inventing fiscal deductibility', () => {
    const calculation = calculate({
      expenses: [
        expense({
          id: 'legacy',
          issuedAt: date(1),
          subtotal: 20,
          vatAmount: 0,
          vatDeductiblePercent: null,
          irpfDeductiblePercent: null,
          hasVatBreakdown: false,
        }),
      ],
    })

    assert.equal(calculation.modelo303.supportedVat, 0)
    assert.equal(calculation.modelo303.deductibleVat, 0)
    assert.equal(calculation.modelo130.deductibleExpenses, 0)
    assert.deepEqual(calculation.audit.undefinedFiscalExpenseIds, {
      vat: ['legacy'],
      irpf: ['legacy'],
    })
    assert.deepEqual(
      calculation.warnings.map((warning) => warning.code),
      [
        'EXPENSE_VAT_BREAKDOWN_MISSING',
        'EXPENSE_VAT_TREATMENT_UNDEFINED',
        'EXPENSE_IRPF_TREATMENT_UNDEFINED',
      ],
    )
  })

  it('applies the explicit fiscal treatment of a new expense', () => {
    const calculation = calculate({
      expenses: [
        expense({
          id: 'new-expense',
          issuedAt: date(1),
          subtotal: 100,
          vatAmount: 21,
          vatDeductiblePercent: 50,
          irpfDeductiblePercent: 100,
        }),
      ],
    })

    assert.equal(calculation.modelo303.deductibleVat, 10.5)
    assert.equal(calculation.modelo130.deductibleExpenses, 100)
    assert.deepEqual(calculation.warnings, [])
  })

  it('excludes a cancelled expense from both models and records the reason', () => {
    const calculation = calculate({
      expenses: [
        expense({
          id: 'cancelled',
          issuedAt: date(1),
          subtotal: 100,
          vatAmount: 21,
          vatDeductiblePercent: 100,
          irpfDeductiblePercent: 100,
          status: 'cancelled',
        }),
      ],
    })

    assert.equal(calculation.modelo303.supportedVat, 0)
    assert.equal(calculation.modelo303.deductibleVat, 0)
    assert.equal(calculation.modelo130.deductibleExpenses, 0)
    assert.deepEqual(
      calculation.audit.ignoredDocuments.find((document) => document.documentId === 'cancelled'),
      {
        documentType: 'expense',
        documentId: 'cancelled',
        models: ['modelo303', 'modelo130'],
        reason: 'cancelled',
      },
    )
    assert.ok(
      calculation.warnings.some(
        (warning) => warning.code === 'EXPENSE_CANCELLED' && warning.documentId === 'cancelled',
      ),
    )
  })

  it('uses day 20 for Q1-Q3 and January 30 of the next year for Q4', () => {
    assert.deepEqual(getQuarterDeadline(2026, 'Q1'), new Date(2026, 3, 20, 23, 59, 59, 999))
    assert.deepEqual(getQuarterDeadline(2026, 'Q2'), new Date(2026, 6, 20, 23, 59, 59, 999))
    assert.deepEqual(getQuarterDeadline(2026, 'Q3'), new Date(2026, 9, 20, 23, 59, 59, 999))
    assert.deepEqual(getQuarterDeadline(2026, 'Q4'), new Date(2027, 0, 30, 23, 59, 59, 999))

    assert.equal(
      calculate({ quarter: 'Q4', now: new Date(2027, 0, 30, 12) }).modelo303.status,
      'pending',
    )
    assert.equal(
      calculate({ quarter: 'Q4', now: new Date(2027, 0, 31) }).modelo303.status,
      'overdue',
    )
  })
})

describe('payment status does not change fiscal deductions', () => {
  for (const percentage of [0, 50, 100, null]) {
    it(`preserves both tax models at ${percentage}% when a pending expense is paid`, () => {
      const document = expense({
        id: 'payment-transition', issuedAt: date(0), subtotal: 100, vatAmount: 21,
        vatDeductiblePercent: percentage, irpfDeductiblePercent: percentage, status: 'pending',
      })
      const pending = calculate({ expenses: [document] })
      const paid = calculate({ expenses: [{ ...document, status: 'paid' }] })
      assert.deepEqual(paid, pending)
    })
  }
})
