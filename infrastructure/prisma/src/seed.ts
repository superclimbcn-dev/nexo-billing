import { prisma, Prisma } from './index'

const now = new Date()
const yesterday = new Date(now)
yesterday.setDate(yesterday.getDate() - 1)
const twoDaysAgo = new Date(now)
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
const threeDaysAgo = new Date(now)
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
const nextMonth = new Date(now)
nextMonth.setMonth(nextMonth.getMonth() + 1)

async function main() {
  console.log('🌱 Seeding database...')

  // ── 1. VERTICALS ──────────────────────────────────────────────────────────
  const verticalCleaning = await prisma.vertical.upsert({
    where: { slug: 'cleaning' },
    update: {},
    create: {
      slug: 'cleaning',
      name: 'Limpieza y mantenimiento',
      description: 'Empresas de limpieza, mantenimiento de edificios y servicios auxiliares',
      status: 'active',
      modulesEnabled: ['recurring_contracts', 'service_sheets', 'routes'],
      cnaeMapping: ['8121', '8122', '8129'],
      iconName: '🧽',
      color: '#d4ff3f',
      sortOrder: 1,
    },
  })

  const verticalGeneric = await prisma.vertical.upsert({
    where: { slug: 'generic' },
    update: {},
    create: {
      slug: 'generic',
      name: 'Genérico',
      description: 'Configuración estándar adaptable a cualquier sector',
      status: 'active',
      modulesEnabled: [],
      cnaeMapping: [],
      iconName: '✦',
      color: '#d4ff3f',
      sortOrder: 99,
    },
  })

  console.log(`  ✓ Verticals: ${verticalCleaning.name}, ${verticalGeneric.name}`)

  // ── 2. TENANT ─────────────────────────────────────────────────────────────
  const tenantId = '00000000-0000-0000-0000-000000000001'

  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: 'Superclim Servicios',
      legalName: 'Superclim Servicios S.L.',
      nif: 'B65432198',
      cnae: '8121',
      businessType: 'Limpieza y mantenimiento',
      verticalId: verticalCleaning.id,
      plan: 'starter',
      country: 'ES',
      currency: 'EUR',
      vatRegime: 'general',
      fiscalYearStart: 1,
      fiscalAddress: 'Avinguda Barberà 88',
      fiscalCity: 'Sabadell',
      fiscalPostal: '08205',
      fiscalProvince: 'Barcelona',
      iban: 'ES9121000418450200051332',
      email: 'facturacion@superclim.es',
      phone: '+34937123456',
      websiteUrl: 'https://superclim.es',
    },
  })

  await prisma.brandingConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      primaryColor: '#d4ff3f',
      secondaryColor: '#0a0a0b',
      accentColor: '#a3cc2c',
      textOnPrimary: '#0a0a0b',
      fontFamily: 'Inter',
      invoiceTemplate: 'modern',
      invoiceShowLogo: true,
      invoiceShowQr: true,
    },
  })

  console.log(`  ✓ Tenant: ${tenant.name}`)

  // ── 3. INVOICE SERIES ─────────────────────────────────────────────────────
  const seriesA = await prisma.invoiceSeries.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'A' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'A',
      name: 'Facturas estándar',
      prefix: 'A-',
      numberFormat: '0000',
      nextNumber: 5,
      isDefault: true,
      isActive: true,
      resetYearly: true,
      yearOfNumbering: now.getFullYear(),
    },
  })

  const seriesR = await prisma.invoiceSeries.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'R' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'R',
      name: 'Rectificativas',
      prefix: 'R-',
      numberFormat: '0000',
      nextNumber: 1,
      isDefault: false,
      isActive: true,
      resetYearly: true,
      yearOfNumbering: now.getFullYear(),
    },
  })

  const seriesP = await prisma.invoiceSeries.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'P' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'P',
      name: 'Presupuestos',
      prefix: 'P-',
      numberFormat: '0000',
      nextNumber: 3,
      isDefault: false,
      isActive: true,
      resetYearly: true,
      yearOfNumbering: now.getFullYear(),
    },
  })

  console.log(`  ✓ Invoice series: A, R, P`)

  // ── 4. CLIENTES ───────────────────────────────────────────────────────────
  const client1 = await prisma.client.upsert({
    where: { tenantId_nif: { tenantId: tenant.id, nif: 'B78945612' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Superclim Servicios',
      legalName: 'Superclim Servicios S.L.',
      nif: 'B78945612',
      clientType: 'business',
      vatRegime: 'general',
      email: 'superclimbcn@gmail.com',
      phone: '+34624529442',
      contactPerson: 'Carlos Martínez',
      address: 'Carrer de Mallorca 245, 3º',
      city: 'Barcelona',
      postalCode: '08008',
      province: 'Barcelona',
      country: 'ES',
      paymentTerms: 30,
      defaultVatRate: new Prisma.Decimal(21),
      notes: 'Cliente habitual. Limpieza mensual de oficinas.',
      isActive: true,
    },
  })

  const client2 = await prisma.client.upsert({
    where: { tenantId_nif: { tenantId: tenant.id, nif: 'B12345678' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Carpintería Joaquín SL',
      legalName: 'Carpintería Joaquín S.L.',
      nif: 'B12345678',
      clientType: 'business',
      vatRegime: 'general',
      email: 'joaquin@carpinteria.es',
      phone: '+34600123456',
      contactPerson: 'Joaquín López',
      address: 'Polígon Industrial Nord, Parcela 12',
      city: 'Sabadell',
      postalCode: '08203',
      province: 'Barcelona',
      country: 'ES',
      paymentTerms: 15,
      defaultVatRate: new Prisma.Decimal(21),
      notes: 'Carpintería industrial. Pedidos esporádicos.',
      isActive: true,
    },
  })

  const client3 = await prisma.client.upsert({
    where: { tenantId_nif: { tenantId: tenant.id, nif: 'B55667788' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Oficinas Retail Park',
      legalName: 'Retail Park Sabadell S.A.',
      nif: 'B55667788',
      clientType: 'business',
      vatRegime: 'general',
      email: 'admin@retailpark.es',
      phone: '+34937221122',
      contactPerson: 'Ana Ruiz',
      address: 'Polígon Can Roqueta, Nave 4',
      city: 'Sabadell',
      postalCode: '08205',
      province: 'Barcelona',
      country: 'ES',
      paymentTerms: 60,
      defaultVatRate: new Prisma.Decimal(21),
      notes: 'Centro comercial. Limpieza diaria de zonas comunes.',
      isActive: true,
    },
  })

  const client4 = await prisma.client.upsert({
    where: { tenantId_nif: { tenantId: tenant.id, nif: 'A12345678' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Hotel Gracia Boutique',
      legalName: 'Hotel Gracia Boutique S.L.',
      nif: 'A12345678',
      clientType: 'business',
      vatRegime: 'general',
      email: 'recepcion@hotelgracia.es',
      phone: '+34932001122',
      contactPerson: 'Marta Gómez',
      address: 'Carrer de Gràcia 142',
      city: 'Barcelona',
      postalCode: '08012',
      province: 'Barcelona',
      country: 'ES',
      paymentTerms: 30,
      defaultVatRate: new Prisma.Decimal(21),
      notes: 'Hotel boutique. Limpieza de habitaciones y zonas comunes.',
      isActive: true,
    },
  })

  console.log(`  ✓ Clients: ${client1.name}, ${client2.name}, ${client3.name}, ${client4.name}`)

  // ── 5. ITEMS (Productos / Servicios) ──────────────────────────────────────
  const item1 = await prisma.item.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      tenantId: tenant.id,
      name: 'Limpieza estándar',
      description: 'Limpieza mensual de oficinas y zonas comunes',
      type: 'service',
      unitPrice: new Prisma.Decimal(35.0),
      vatRate: new Prisma.Decimal(21),
      unit: 'hora',
      isActive: true,
    },
  })

  const item2 = await prisma.item.upsert({
    where: { id: '00000000-0000-0000-0000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000102',
      tenantId: tenant.id,
      name: 'Limpieza de cristales',
      description: 'Limpieza extra de ventanas y cristales',
      type: 'service',
      unitPrice: new Prisma.Decimal(120.0),
      vatRate: new Prisma.Decimal(21),
      unit: 'servicio',
      isActive: true,
    },
  })

  const item3 = await prisma.item.upsert({
    where: { id: '00000000-0000-0000-0000-000000000103' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000103',
      tenantId: tenant.id,
      name: 'Productos kit',
      description: 'Kit de productos de limpieza especializados',
      type: 'product',
      unitPrice: new Prisma.Decimal(120.0),
      vatRate: new Prisma.Decimal(21),
      unit: 'kit',
      stockEnabled: true,
      currentStock: new Prisma.Decimal(25),
      isActive: true,
    },
  })

  console.log(`  ✓ Items: ${item1.name}, ${item2.name}, ${item3.name}`)

  // ── 6. FACTURAS ───────────────────────────────────────────────────────────
  // Helper para crear factura con líneas
  async function createInvoiceWithLines(data: {
    id: string
    clientId: string
    seriesId: string
    number: number
    fullNumber: string
    status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled'
    issuedAt: Date
    dueAt: Date
    lines: Array<{
      itemId?: string
      description: string
      quantity: number
      unitPrice: number
      vatRate: number
      sortOrder: number
    }>
  }) {
    // Calcular totales
    let subtotal = new Prisma.Decimal(0)
    let vatAmount = new Prisma.Decimal(0)

    const lineCreates = data.lines.map((line) => {
      const qty = new Prisma.Decimal(line.quantity)
      const price = new Prisma.Decimal(line.unitPrice)
      const vatRate = new Prisma.Decimal(line.vatRate)
      const lineSubtotal = qty.mul(price)
      const lineVat = lineSubtotal.mul(vatRate).div(100)
      const lineTotal = lineSubtotal.add(lineVat)

      subtotal = subtotal.add(lineSubtotal)
      vatAmount = vatAmount.add(lineVat)

      return {
        itemId: line.itemId || null,
        description: line.description,
        quantity: qty,
        unitPrice: price,
        discountPercent: new Prisma.Decimal(0),
        vatRate,
        claveOperacion: '01',
        subtotal: lineSubtotal,
        vatAmount: lineVat,
        totalAmount: lineTotal,
        sortOrder: line.sortOrder,
      }
    })

    const totalAmount = subtotal.add(vatAmount)
    const paidAmount =
      data.status === 'paid'
        ? totalAmount
        : data.status === 'partially_paid'
          ? totalAmount.mul(0.5)
          : new Prisma.Decimal(0)

    await prisma.invoice.upsert({
      where: { id: data.id },
      update: {},
      create: {
        id: data.id,
        tenantId: tenant.id,
        clientId: data.clientId,
        seriesId: data.seriesId,
        number: data.number,
        fullNumber: data.fullNumber,
        type: 'F1',
        status: data.status,
        issuedAt: data.issuedAt,
        dueAt: data.dueAt,
        subtotal,
        vatAmount,
        totalAmount,
        paidAmount,
        pendingAmount: totalAmount.sub(paidAmount),
        currency: 'EUR',
        paymentTerms: 30,
        paymentMethod: 'bank_transfer',
        lines: { create: lineCreates },
      },
    })
  }

  await createInvoiceWithLines({
    id: '00000000-0000-0000-0000-000000000201',
    clientId: client2.id,
    seriesId: seriesA.id,
    number: 1,
    fullNumber: `A-${now.getFullYear()}-0001`,
    status: 'paid',
    issuedAt: threeDaysAgo,
    dueAt: new Date(threeDaysAgo.getTime() + 30 * 86400000),
    lines: [
      { itemId: item1.id, description: 'Limpieza mensual oficinas', quantity: 5, unitPrice: 35, vatRate: 21, sortOrder: 0 },
      { itemId: item3.id, description: 'Kit productos limpieza', quantity: 1, unitPrice: 120, vatRate: 21, sortOrder: 1 },
    ],
  })

  await createInvoiceWithLines({
    id: '00000000-0000-0000-0000-000000000202',
    clientId: client2.id,
    seriesId: seriesA.id,
    number: 2,
    fullNumber: `A-${now.getFullYear()}-0002`,
    status: 'draft',
    issuedAt: twoDaysAgo,
    dueAt: new Date(twoDaysAgo.getTime() + 15 * 86400000),
    lines: [
      { itemId: item1.id, description: 'Limpieza especial nave industrial', quantity: 8, unitPrice: 35, vatRate: 21, sortOrder: 0 },
    ],
  })

  await createInvoiceWithLines({
    id: '00000000-0000-0000-0000-000000000203',
    clientId: client1.id,
    seriesId: seriesA.id,
    number: 3,
    fullNumber: `A-${now.getFullYear()}-0003`,
    status: 'draft',
    issuedAt: yesterday,
    dueAt: new Date(yesterday.getTime() + 30 * 86400000),
    lines: [
      { itemId: item1.id, description: 'Limpieza oficinas centrales', quantity: 10, unitPrice: 35, vatRate: 21, sortOrder: 0 },
    ],
  })

  await createInvoiceWithLines({
    id: '00000000-0000-0000-0000-000000000204',
    clientId: client1.id,
    seriesId: seriesA.id,
    number: 4,
    fullNumber: `A-${now.getFullYear()}-0004`,
    status: 'draft',
    issuedAt: now,
    dueAt: new Date(now.getTime() + 30 * 86400000),
    lines: [
      { itemId: item1.id, description: 'Limpieza mensual oficinas', quantity: 8, unitPrice: 35, vatRate: 21, sortOrder: 0 },
      { itemId: item2.id, description: 'Limpieza extra cristales fin trimestre', quantity: 1, unitPrice: 120, vatRate: 21, sortOrder: 1 },
    ],
  })

  console.log(`  ✓ Invoices: 4 created`)

  // ── 7. PRESUPUESTOS ───────────────────────────────────────────────────────
  await prisma.quote.upsert({
    where: { id: '00000000-0000-0000-0000-000000000301' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000301',
      tenantId: tenant.id,
      clientId: client4.id,
      number: `P-${now.getFullYear()}-0001`,
      status: 'sent',
      issuedAt: new Date(now.getTime() - 7 * 86400000),
      validUntil: new Date(now.getTime() + 23 * 86400000),
      subtotal: new Prisma.Decimal(2380),
      vatAmount: new Prisma.Decimal(499.8),
      totalAmount: new Prisma.Decimal(2879.8),
      notes: 'Presupuesto anual limpieza hotel',
      lines: {
        create: [
          {
            itemId: item1.id,
            description: 'Limpieza mensual habitaciones y zonas comunes',
            quantity: new Prisma.Decimal(1),
            unitPrice: new Prisma.Decimal(2380),
            discountPercent: new Prisma.Decimal(0),
            vatRate: new Prisma.Decimal(21),
            subtotal: new Prisma.Decimal(2380),
            vatAmount: new Prisma.Decimal(499.8),
            totalAmount: new Prisma.Decimal(2879.8),
            sortOrder: 0,
          },
        ],
      },
    },
  })

  await prisma.quote.upsert({
    where: { id: '00000000-0000-0000-0000-000000000302' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000302',
      tenantId: tenant.id,
      clientId: client3.id,
      number: `P-${now.getFullYear()}-0002`,
      status: 'draft',
      issuedAt: new Date(now.getTime() - 3 * 86400000),
      validUntil: new Date(now.getTime() + 27 * 86400000),
      subtotal: new Prisma.Decimal(3200),
      vatAmount: new Prisma.Decimal(672),
      totalAmount: new Prisma.Decimal(3872),
      notes: 'Limpieza diaria centro comercial',
      lines: {
        create: [
          {
            itemId: item1.id,
            description: 'Limpieza diaria zonas comunes retail park',
            quantity: new Prisma.Decimal(1),
            unitPrice: new Prisma.Decimal(3200),
            discountPercent: new Prisma.Decimal(0),
            vatRate: new Prisma.Decimal(21),
            subtotal: new Prisma.Decimal(3200),
            vatAmount: new Prisma.Decimal(672),
            totalAmount: new Prisma.Decimal(3872),
            sortOrder: 0,
          },
        ],
      },
    },
  })

  console.log(`  ✓ Quotes: 2 created`)

  // ── 8. CONTRATOS RECURRENTES ──────────────────────────────────────────────
  const recurringSubtotal = new Prisma.Decimal(350)
  const recurringTax = new Prisma.Decimal(73.5)
  const recurringTotal = new Prisma.Decimal(423.5)

  await prisma.recurringContract.upsert({
    where: { id: '00000000-0000-0000-0000-000000000401' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000401',
      tenantId: tenant.id,
      clientId: client1.id,
      name: 'Limpieza mensual oficinas',
      frequency: 'MONTHLY',
      status: 'ACTIVE',
      startDate: new Date(now.getFullYear(), 0, 1),
      nextBillingAt: nextMonth,
      seriesCode: 'A',
      subtotal: recurringSubtotal,
      taxAmount: recurringTax,
      total: recurringTotal,
      lines: {
        create: [
          {
            description: 'Limpieza mensual oficinas',
            quantity: new Prisma.Decimal(10),
            unitPrice: new Prisma.Decimal(35),
            taxRate: new Prisma.Decimal(21),
            total: recurringTotal,
            position: 0,
          },
        ],
      },
    },
  })

  console.log(`  ✓ Recurring contracts: 1 created`)

  console.log('\n🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
