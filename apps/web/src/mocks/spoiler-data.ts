import type { StatusType, DotState, KpiDeltaVariant } from '@nexo/core-ui'

type KpiMock = {
  label: string
  value: string
  unit: string
  delta: string
  deltaVariant: KpiDeltaVariant
  featured?: boolean
  sparkPath?: string
}

export const tenant = {
  name: 'Superclim Servicios',
  nif: 'B-65432198',
  sector: 'Limpieza',
  initials: 'SC',
}

export const dashboardKpis: KpiMock[] = [
  {
    label: 'Facturado este mes',
    value: '14.280',
    unit: '€',
    delta: '↑ 18% vs marzo',
    deltaVariant: 'up' as const,
    featured: true,
    sparkPath: 'M0,24 L12,20 L24,22 L36,14 L48,16 L60,8 L72,10 L80,4',
  },
  {
    label: 'Cobrado',
    value: '9.840',
    unit: '€',
    delta: '↑ 12%',
    deltaVariant: 'up' as const,
  },
  {
    label: 'Pendiente',
    value: '4.440',
    unit: '€',
    delta: '↑ 3 facturas vencidas',
    deltaVariant: 'down' as const,
  },
  {
    label: 'IVA a liquidar',
    value: '2.476',
    unit: '€',
    delta: 'Próximo modelo 303: 20 abr',
    deltaVariant: 'neutral' as const,
  },
]

export const recentInvoices = [
  {
    number: 'F2026-0142',
    clientName: 'Administrador Comunidades Badalona',
    clientMeta: 'B-67890123 · hace 2h',
    clientAvatar: {
      initials: 'AC',
      gradient: 'linear-gradient(135deg,#f97316,#c2410c)',
    },
    amount: '1.240 €',
    status: 'paid' as StatusType,
    statusLabel: 'Cobrada',
  },
  {
    number: 'F2026-0141',
    clientName: 'Hotel Gracia Boutique',
    clientMeta: 'A-12345678 · hace 5h',
    clientAvatar: {
      initials: 'HG',
      gradient: 'linear-gradient(135deg,#8b5cf6,#5b21b6)',
    },
    amount: '2.880 €',
    status: 'sent' as StatusType,
    statusLabel: 'Enviada',
  },
  {
    number: 'F2026-0140',
    clientName: 'Oficinas Retail Park Sabadell',
    clientMeta: 'B-55667788 · ayer',
    clientAvatar: {
      initials: 'OR',
      gradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    },
    amount: '3.200 €',
    status: 'pending' as StatusType,
    statusLabel: 'Pendiente',
  },
  {
    number: 'F2026-0139',
    clientName: 'Clínica Medina',
    clientMeta: 'B-99887766 · 19 abr',
    clientAvatar: {
      initials: 'CM',
      gradient: 'linear-gradient(135deg,#ec4899,#be185d)',
    },
    amount: '960 €',
    status: 'overdue' as StatusType,
    statusLabel: 'Vencida 3d',
  },
  {
    number: 'F2026-0138',
    clientName: 'Residencial Camp Nou',
    clientMeta: 'H-11223344 · 17 abr',
    clientAvatar: {
      initials: 'RC',
      gradient: 'linear-gradient(135deg,#10b981,#047857)',
    },
    amount: '1.420 €',
    status: 'paid' as StatusType,
    statusLabel: 'Cobrada',
  },
]

export const createInvoiceData = {
  title: 'F2026-0143',
  subtitle: 'F2026-0143 · se enviará a Hacienda al emitir',
  client: {
    name: 'Hotel Gracia Boutique S.L.',
    nif: 'A-12345678',
    address: 'Carrer de Gràcia 142, 08012 Barcelona',
  },
  invoice: {
    serie: 'F2026',
    numero: '0143',
    fecha: '22/04/2026',
  },
  lineItems: [
    {
      description: 'Limpieza mensual habitaciones y zonas comunes',
      quantity: '1',
      price: '2.380,00',
      vat: '21%',
      subtotal: '2.380,00€',
    },
    {
      description: 'Limpieza extra de cristales (fin de trimestre)',
      quantity: '1',
      price: '500,00',
      vat: '21%',
      subtotal: '500,00€',
    },
  ],
  totals: {
    base: '2.880,00 €',
    vatLabel: 'IVA 21%',
    vatAmount: '604,80 €',
    total: '3.484,80€',
  },
  pdf: {
    invoiceNumber: 'F2026-0143',
    issuer: { name: 'Superclim', nameItalic: 'Servicios' },
    from: {
      label: 'De',
      name: 'Superclim Servicios S.L.',
      detail: 'B-65432198\nAvinguda Barberà 88\n08205 Sabadell',
    },
    to: {
      label: 'Para',
      name: 'Hotel Gracia Boutique S.L.',
      detail: 'A-12345678\nCarrer de Gràcia 142\n08012 Barcelona',
    },
    lineItems: [
      { description: 'Limpieza mensual habitaciones y zonas comunes', qty: '1', price: '2.380,00€', total: '2.380,00€' },
      { description: 'Limpieza extra de cristales', qty: '1', price: '500,00€', total: '500,00€' },
    ],
    totals: {
      base: '2.880,00€',
      vatLabel: 'IVA 21%',
      vatAmount: '604,80€',
      total: '3.484,80€',
    },
  },
}

export const mobilePhone1 = {
  greeting: 'Hola,',
  greetingName: 'Carlos',
  subtitle: 'MIÉRCOLES · 22 ABR',
  todayCount: '5',
  todayDesc: 'servicios · 2 completados',
  services: [
    { time: '08:30', client: 'Residencial Camp Nou', address: 'Carrer Maria Cristina 12', status: 'done' as const },
    { time: '10:00', client: 'Oficinas Retail Park', address: 'Polígon Can Roqueta, Sabadell', status: 'done' as const },
    { time: '12:30', client: 'Hotel Gracia Boutique', address: 'Carrer de Gràcia 142', status: 'in-progress' as const },
    { time: '15:00', client: 'Clínica Medina', address: 'Passeig Sant Joan 47', status: 'pending' as const },
    { time: '17:00', client: 'Admón. Comunidades', address: 'Av. Martí Pujol 203, Badalona', status: 'pending' as const },
  ],
}

export const mobilePhone2 = {
  clientName: 'Hotel Gracia Boutique',
  checkInTime: '12:34',
  timer: '01:47:22',
  location: 'Ubicación verificada · 12 m',
  actions: [
    { icon: '📷', label: 'FOTO ANTES ✓', done: true },
    { icon: '📷', label: 'FOTO DESPUÉS', done: false },
    { icon: '✎', label: 'FIRMA CLIENTE', done: false },
    { icon: '🧴', label: 'CONSUMIBLES', done: false },
  ],
}

export const onboardingData = {
  progressDots: ['done', 'done', 'active', 'empty', 'empty'] as DotState[],
  verticals: [
    { icon: '🧽', title: 'Limpieza', description: 'Contratos recurrentes, partes de servicio, rutas, m²', selected: true },
    { icon: '🔨', title: 'Construcción', description: 'Certificaciones de obra, retención garantía, subcontratas', selected: false },
    { icon: '⚕', title: 'Médicos y clínicas', description: 'Exención IVA art. 20, RGPD reforzado, agenda', selected: false },
    { icon: '⚖', title: 'Servicios profesionales', description: 'Abogados, consultores, minutas, horas facturables', selected: false },
    { icon: '🛍', title: 'Retail y comercio', description: 'TPV, tickets, facturas simplificadas, inventario', selected: false },
    { icon: '✦', title: 'Otro', description: 'Configuración genérica adaptada', selected: false },
  ],
}
