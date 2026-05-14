import { prisma } from '@nexo/prisma'

const posts = [
  {
    slug: 'crear-primera-factura-2-minutos',
    title: 'Cómo crear tu primera factura en 2 minutos',
    excerpt:
      'Guía paso a paso para crear una factura profesional cumpliendo con la normativa española y Verifactu 2027. Desde el cliente hasta el envío.',
    content: `# Cómo crear tu primera factura en 2 minutos

Crear una factura profesional nunca fue tan sencillo. Con Nexo Billing puedes emitir una factura cumpliendo con toda la normativa española en menos de 2 minutos.

## Paso 1: Accede a "Nueva factura"

Desde el dashboard, haz clic en **Nueva factura** o selecciona la opción desde el menú de Facturas.

## Paso 2: Selecciona el cliente

Puedes buscar entre tus clientes existentes o crear uno nuevo directamente escribiendo su nombre. El sistema te sugerirá añadirlo si no existe.

## Paso 3: Añade los productos o servicios

Escribe el concepto, cantidad y precio. Puedes usar productos del catálogo o crear descripciones libres. El IVA se calcula automáticamente según tu configuración fiscal.

## Paso 4: Revisa y guarda

Nexo Billing añade automáticamente:
- Numeración correlativa según tu serie
- Texto legal obligatorio (IRPF, IVA incluido)
- QR Verifactu
- Hash de encadenamiento

Haz clic en **Guardar borrador** o **Emitir y enviar**.

## Paso 5: Envía al cliente

Desde el detalle de la factura puedes enviarla por email con PDF adjunto. El cliente recibirá un enlace público donde puede verla e incluso descargarla.

---

*¿Dudas? Escríbenos a contacto@nexo-digital.app*`,
    category: 'empezar',
    image: null,
    videoUrl: null,
    author: 'Equipo Nexo',
    published: true,
    featured: true,
  },
  {
    slug: 'verifactu-2027-que-cambia',
    title: 'Verifactu 2027: qué cambia y cómo prepararte',
    excerpt:
      'Todo lo que necesitas saber sobre el nuevo sistema de facturación obligatorio de la AEAT. Fechas clave, requisitos técnicos y cómo Nexo Billing cumple desde el primer día.',
    content: `# Verifactu 2027: qué cambia y cómo prepararte

A partir de 2027, todos los empresarios y profesionales españoles deberán enviar sus facturas a la AEAT en tiempo real. Este sistema, conocido como **Verifactu**, sustituirá al actual SII para muchos contribuyentes.

## ¿Qué es Verifactu?

Verifactu es el nuevo sistema de verificación de facturas de la Agencia Tributaria. Exige que cada factura incluya:

- **Hash de encadenamiento**: vinculación criptográfica entre facturas consecutivas
- **QR tributario**: código QR verificable por la AEAT
- **Texto legal obligatorio**: menciones específicas en el cuerpo de la factura
- **Envío en tiempo real**: comunicación inmediata con los servidores de la AEAT

## Fechas clave

- **2025-2026**: Periodo de pruebas voluntarias
- **1 de enero de 2027**: Entrada en vigor obligatoria para nuevos obligados tributarios
- **1 de julio de 2027**: Obligatoriedad plena para todos los contribuyentes

## Cómo se prepara Nexo Billing

Nexo Billing cumple con el **RE-1693/2026** desde el primer día:

1. **Generación automática de hash**: cada factura se encadena con la anterior de forma inmutable
2. **QR Verifactu integrado**: generado automáticamente en PDF y enlaces públicos
3. **Envío directo a AEAT**: conexión con la API de Verifactu (Irene Solutions) para envío en tiempo real
4. **Texto legal automático**: incluido en todas las facturas según el tipo de operación

## ¿Qué debes hacer tú?

1. Asegúrate de que tus datos fiscales están correctos en Ajustes
2. Configura tu serie de facturación con numeración correlativa
3. Verifica que tus clientes tienen NIF/CIF correctos
4. ¡Listo! Nexo Billing se encarga del resto.

---

*Mantente informado en nuestro blog y no dudes en contactarnos.*`,
    category: 'verifactu',
    image: null,
    videoUrl: null,
    author: 'Equipo Nexo',
    published: true,
    featured: true,
  },
  {
    slug: 'modelo-303-vs-130-autonomos',
    title: 'Modelo 303 vs Modelo 130: guía para autónomos',
    excerpt:
      'Explicamos las diferencias entre los dos modelos de IVA más importantes para autónomos: cuándo presentar cada uno, cómo calcularlos y trucos para optimizar.',
    content: `# Modelo 303 vs Modelo 130: guía para autónomos

Si eres autónomo en España, seguramente te has cruzado con el **Modelo 303** y el **Modelo 130**. Aunque ambos están relacionados con el IVA, son completamente diferentes.

## Modelo 303: IVA trimestral

El Modelo 303 es la declaración trimestral (o mensual) del IVA. Debes presentarlo si eres empresario o profesional y realizas operaciones sujetas a IVA.

### Frecuencia
- **Trimestral**: la mayoría de autónomos
- **Mensual**: empresas de gran empresa o aquellas con volumen > 6M€

### Plazos
- 1T: 1-20 de abril
- 2T: 1-20 de julio
- 3T: 1-20 de octubre
- 4T: 1-30 de enero (del año siguiente)

### Cómo se calcula
\`\`\`
IVA repercutido (facturas emitidas) - IVA soportado (facturas recibidas) = Cuota a pagar o devolver
\`\`\`

## Modelo 130: IRPF trimestral

El Modelo 130 es el pago a cuenta del IRPF para autónomos. Es un adelanto de lo que pagarás en la Renta anual.

### Frecuencia
Siempre **trimestral** (salvo excepciones).

### Plazos
Igual que el 303.

### Cómo se calcula
\`\`\`
(Ingresos - Gastos) × 20% - Retenciones = Cuota a pagar
\`\`\`

## Diferencias clave

| Aspecto | Modelo 303 | Modelo 130 |
|---------|-----------|-----------|
| Tributo | IVA | IRPF |
| Base | Facturas emitidas y recibidas | Ingresos menos gastos |
| Tipo | Variable (0%, 4%, 10%, 21%) | 20% fijo |
| Devolución | Sí, si IVA soportado > repercutido | No, solo pagos a cuenta |

## Cómo te ayuda Nexo Billing

Nexo Billing calcula automáticamente:
- **Tesorería**: visualización de cobros pendientes para prever liquidez
- **Resumen fiscal**: totales por trimestre con desglose de IVA
- **Exportación ZIP**: todos tus documentos listos para tu asesoría

---

*Consulta siempre con tu asesor fiscal para casos específicos.*`,
    category: 'impuestos',
    image: null,
    videoUrl: null,
    author: 'Equipo Nexo',
    published: true,
    featured: false,
  },
  {
    slug: 'configurar-email-facturacion',
    title: 'Cómo configurar tu email de facturación',
    excerpt:
      'Aprende a configurar el envío de facturas por email con tu propio dominio. SMTP, Resend, reply-to y personalización de remitente.',
    content: `# Cómo configurar tu email de facturación

Enviar facturas por email de forma profesional mejora la imagen de tu empresa y acelera los cobros. En Nexo Billing puedes configurar tu email en menos de 5 minutos.

## Opciones de configuración

### 1. Resend (recomendado)

Resend es el servicio de email transacional que usamos por defecto. Ofrece:
- Alta tasa de entregabilidad
- API simple y fiable
- Soporte para dominios propios

Para configurarlo:
1. Ve a **Ajustes > Email**
2. Introduce tu API key de Resend
3. Configura el remitente (ej: facturas@tuempresa.com)
4. Guarda y haz clic en **Enviar email de prueba**

### 2. SMTP propio

Si prefieres usar tu propio servidor de correo:
1. Ve a **Ajustes > Email**
2. Selecciona "SMTP personalizado"
3. Introduce host, puerto, usuario y contraseña
4. Guarda y verifica

**Nota de seguridad**: tu contraseña SMTP se almacena cifrada con AES-256-GCM.

## Personalización del email

Puedes configurar:
- **Nombre del remitente**: aparecerá como "Tu Empresa <facturas@tuempresa.com>"
- **Reply-to**: dirección donde el cliente responderá
- **Asunto**: por defecto "Factura FV-001 — Tu Empresa"

## Plantilla de email

El email incluye automáticamente:
- Saludo personalizado con el nombre del cliente
- Resumen de la factura (número, importe, fecha)
- Botón para ver la factura online (PWA)
- PDF adjunto con la factura completa

## Consejos para mejorar la entregabilidad

1. Usa un dominio propio (no Gmail, Yahoo, etc.)
2. Configura SPF, DKIM y DMARC en tu DNS
3. Evita palabras spam en el asunto
4. Mantén una lista de clientes limpia

---

*¿Problemas con la entrega? Escríbenos a contacto@nexo-digital.app*`,
    category: 'empezar',
    image: null,
    videoUrl: null,
    author: 'Equipo Nexo',
    published: true,
    featured: false,
  },
  {
    slug: 'factura-presupuesto-contrato-diferencias',
    title: 'Diferencia entre factura, presupuesto y contrato',
    excerpt:
      'Entiende cuándo usar cada documento: presupuestos para proponer, contratos para recurrentes y facturas para cobrar. Con ejemplos prácticos.',
    content: `# Diferencia entre factura, presupuesto y contrato

Tres documentos, tres momentos del ciclo comercial. Saber cuándo usar cada uno es clave para una gestión fiscal correcta.

## Presupuesto

El presupuesto es una **propuesta comercial**. No tiene validez fiscal ni obliga al cliente a pagar.

### Cuándo usarlo
- Antes de cerrar una venta
- Para grandes proyectos con varios conceptos
- Cuando el cliente solicita precios

### Características en Nexo Billing
- Numeración independiente de facturas
- Validez configurable (15 días, 30 días...)
- Posibilidad de convertir en factura con un clic
- Estado: Borrador → Enviado → Aceptado → Rechazado

## Contrato (Recurrente)

El contrato es un **acuerdo de prestación periódica**. Genera facturas automáticamente según la periodicidad acordada.

### Cuándo usarlo
- Servicios de mantenimiento mensual
- Alquileres recurrentes
- Suscripciones o cuotas

### Características en Nexo Billing
- Periodicidad: mensual, trimestral, anual
- Emisión automática de facturas
- Estado: Activo → Pausado → Cancelado
- Historial completo de facturas emitidas

## Factura

La factura es el **documento fiscal definitivo**. Acredita la operación y obliga al pago.

### Cuándo usarla
- Tras prestar el servicio o entregar el producto
- Cuando el cliente acepta el presupuesto
- Al finalizar cada período del contrato

### Características en Nexo Billing
- Numeración correlativa obligatoria
- Incluye QR Verifactu y hash de encadenamiento
- Estados: Borrador → Emitida → Enviada → Cobrada → Anulada
- Rectificativas automáticas si hay errores

## Resumen comparativo

| Documento | Momento | Fiscal | Genera cobro |
|-----------|---------|--------|-------------|
| Presupuesto | Antes de la venta | No | No |
| Contrato | Acuerdo periódico | No | No (directamente) |
| Factura | Tras la venta | Sí | Sí |

## Flujo recomendado

1. **Presupuesto** → cliente solicita precio
2. **Aceptación** → cliente aprueba el presupuesto
3. **Factura** → emitir al prestar el servicio
4. **Contrato** → si es recurrente, configurar periodicidad

---

*¿Tienes un caso específico? Consulta con tu asesor o escríbenos.*`,
    category: 'facturar',
    image: null,
    videoUrl: null,
    author: 'Equipo Nexo',
    published: true,
    featured: false,
  },
]

export async function seedBlogPosts() {
  let created = 0
  let skipped = 0

  for (const post of posts) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
      select: { id: true },
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.blogPost.create({ data: post })
    created++
  }

  return { created, skipped, total: posts.length }
}
