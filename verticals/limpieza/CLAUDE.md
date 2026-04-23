# verticals/limpieza — Vertical Limpieza

> Primer vertical de Nexo Billing. Cliente alpha real: **Superclim Servicios** (Barcelona). Dogfooding 100%.

---

## 1. Qué resuelve este vertical

Problemas específicos de autónomos y pequeñas empresas de limpieza que los SaaS genéricos no cubren bien:

- **Contratos recurrentes** con facturación automática mensual/trimestral.
- **Servicios por ruta**: un operario visita varios clientes en un día. Hay que trackear partes de servicio.
- **Facturación por m²** o por hora, con tarifas contratadas por cliente.
- **Partes de servicio** firmados por el cliente (foto, firma digital, geolocalización).
- **Consumibles**: productos y material usados en cada servicio, facturables o incluidos.
- **Subcontratistas** (autónomos que trabajan para la empresa) con liquidación mensual.
- **Presupuestos rápidos** desde el móvil en casa del cliente.

---

## 2. Entidades del dominio (específicas de limpieza)

Todas extienden del core (`Client`, `Product`, `Invoice`) vía `sectorMetadata` o tablas propias con FK al core.

### 2.1 Nuevas tablas del vertical

```prisma
// En infrastructure/prisma/schema.prisma, sección limpieza

model CleaningContract {
  id              String   @id @default(cuid())
  tenantId        String
  clientId        String
  startDate       DateTime
  endDate         DateTime?
  frequency       ContractFrequency  // WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY
  serviceDayOfWeek Int?              // 0-6 para servicios semanales
  monthlyPrice    Decimal  @db.Decimal(10, 2)
  vatRate         Decimal  @db.Decimal(5, 2)  // típicamente 21%
  locationAddress String
  locationM2      Int?
  notes           String?
  active          Boolean  @default(true)
  autoInvoice     Boolean  @default(true)

  client          Client   @relation(fields: [clientId], references: [id])
  services        CleaningService[]

  @@index([tenantId, clientId])
  @@map("cleaning_contracts")
}

model CleaningService {
  id              String   @id @default(cuid())
  tenantId        String
  contractId      String?
  clientId        String
  serviceDate     DateTime
  durationMinutes Int
  workerIds       String[]           // operarios asignados
  checkInTime     DateTime?
  checkOutTime    DateTime?
  checkInLat      Decimal? @db.Decimal(10, 7)
  checkInLng      Decimal? @db.Decimal(10, 7)
  clientSignature String?            // URL a imagen en Supabase Storage
  photoUrls       String[]
  consumables     Json?              // [{ productId, quantity }]
  notes           String?
  status          ServiceStatus      // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

  contract        CleaningContract? @relation(fields: [contractId], references: [id])
  client          Client            @relation(fields: [clientId], references: [id])

  @@index([tenantId, serviceDate])
  @@map("cleaning_services")
}

enum ContractFrequency {
  WEEKLY
  BIWEEKLY
  MONTHLY
  QUARTERLY
  ANNUAL
}

enum ServiceStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

### 2.2 Uso de `sectorMetadata` en Invoice

Cuando se factura un servicio de limpieza, `Invoice.sectorMetadata` guarda:

```typescript
{
  vertical: 'limpieza',
  contractId?: string,
  servicesIncluded: string[],    // IDs de CleaningService facturados
  periodFrom: string,             // ISO date
  periodTo: string,
  m2: number?,
  pricePerM2?: number,
}
```

---

## 3. Flujos específicos del vertical

### 3.1 Facturación recurrente automática

Cron job (Supabase Edge Function con schedule):
1. Cada día 1 del mes, buscar contratos activos con `frequency: MONTHLY`, `autoInvoice: true`.
2. Agregar servicios del mes anterior.
3. Generar factura automáticamente.
4. Enviar a Verifactu.
5. Enviar email al cliente con PDF + QR.
6. Registrar en `invoice_automations` log.

### 3.2 Parte de servicio móvil (PWA / app)

Pantalla "Hoy" para el operario:
1. Lista de servicios del día ordenados por ruta óptima (Google Maps API).
2. Check-in: captura geolocalización + foto del estado inicial.
3. Check-out: foto del estado final + firma del cliente (canvas).
4. Registro offline-first (IndexedDB), sincroniza cuando haya conexión.

### 3.3 Presupuesto rápido in situ

Operario comercial en casa del cliente:
1. Mide m² (captura manual o LiDAR si dispositivo lo soporta).
2. Selecciona tipo de servicio (mantenimiento, única, fin de obra).
3. Sistema calcula precio según tarifa base del tenant.
4. PDF generado en <5 segundos, enviable por WhatsApp al cliente.

---

## 4. UI específica (componentes del vertical)

Ubicados en `verticals/limpieza/src/components/`:

- `ContractForm.tsx` — alta/edición de contrato
- `ContractList.tsx` — lista con filtros
- `ServiceScheduler.tsx` — calendario semanal con drag & drop
- `ServiceCheckInScreen.tsx` — pantalla móvil de check-in
- `RecurringInvoicePreview.tsx` — preview antes de emitir factura automática
- `RouteOptimizer.tsx` — visualización de la ruta del día

**Design system**: todos los componentes usan `packages/core-ui` como base. Extienden, nunca forkean.

---

## 5. Rutas Next.js del vertical

En `apps/web/src/app/(tenant)/limpieza/`:

```
limpieza/
├── contratos/
│   ├── page.tsx              # lista
│   ├── nuevo/page.tsx
│   └── [id]/page.tsx
├── servicios/
│   ├── page.tsx              # calendario
│   ├── hoy/page.tsx          # vista móvil para operario
│   └── [id]/page.tsx
└── presupuestos/
    └── nuevo-rapido/page.tsx
```

El acceso a estas rutas requiere que el middleware valide `tenant.vertical === 'limpieza'`.

---

## 6. Integraciones específicas

- **Google Maps Routes API**: optimización de rutas diarias.
- **Supabase Storage**: almacenamiento de fotos y firmas (bucket `service-evidence`, RLS estricto).
- **Twilio / WhatsApp Business**: envío de confirmación de servicio al cliente.

---

## 7. Dogfooding con Superclim

- Cada release pasa primero por la cuenta de Superclim antes de llegar a otros clientes.
- Elias usa el producto en su operativa real → feedback directo → priorización.
- Los bugs encontrados en Superclim tienen prioridad P0.
- Cuidado: no convertir el producto en "Superclim custom". Toda feature debe generalizarse antes de mergear.

---

## 8. Qué NO hacer en este vertical

- **No** añadir features que solo Superclim usa. Si Elias pide algo demasiado específico, discutir si tiene sentido general. Si no, hacerlo como "plugin" o flag.
- **No** tocar el core de facturación desde aquí. Si falta algo, se añade al core y el vertical lo usa.
- **No** crear nuevas tablas sin `tenant_id` y su política RLS.
- **No** hardcodear tarifas o tipos de IVA. Todo configurable por tenant.
