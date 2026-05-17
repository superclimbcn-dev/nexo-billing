/**
 * Seed script: creates 9 blog posts in Sanity via the Content API.
 * Run: SANITY_API_TOKEN=xxx npx tsx apps/web/sanity/seed/seedPosts.ts
 */
import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const token = process.env.SANITY_API_TOKEN

if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is not set')
if (!token) throw new Error('SANITY_API_TOKEN is not set')

const client = createClient({
  projectId,
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

function block(text: string, style = 'normal') {
  return {
    _type: 'block',
    _key: Math.random().toString(36).slice(2),
    style,
    children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text, marks: [] }],
    markDefs: [],
  }
}

function strong(text: string) {
  const markKey = Math.random().toString(36).slice(2)
  return {
    _type: 'block',
    _key: Math.random().toString(36).slice(2),
    style: 'normal',
    children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text, marks: [markKey] }],
    markDefs: [{ _key: markKey, _type: 'strong' }],
  }
}

function h2(text: string) { return block(text, 'h2') }
function h3(text: string) { return block(text, 'h3') }
function p(text: string) { return block(text, 'normal') }

function bulletList(items: string[]) {
  return {
    _type: 'block',
    _key: Math.random().toString(36).slice(2),
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text: items.join('\n'), marks: [] }],
    markDefs: [],
  }
}

function bullets(items: string[]) {
  return items.map((item) => ({
    _type: 'block',
    _key: Math.random().toString(36).slice(2),
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text: item, marks: [] }],
    markDefs: [],
  }))
}

function numbered(items: string[]) {
  return items.map((item) => ({
    _type: 'block',
    _key: Math.random().toString(36).slice(2),
    style: 'normal',
    listItem: 'number',
    level: 1,
    children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text: item, marks: [] }],
    markDefs: [],
  }))
}

function quote(text: string) { return block(text, 'blockquote') }

const posts = [
  // ────────────────────────────────────────
  // TUTORIAL 1
  // ────────────────────────────────────────
  {
    _type: 'post',
    title: 'Cómo crear tu primera factura en Nexo Billing',
    slug: { _type: 'slug', current: 'como-crear-primera-factura' },
    excerpt: 'Guía paso a paso para emitir tu primera factura profesional: añadir cliente, líneas de servicio, IVA y enviar por email o WhatsApp. En menos de 3 minutos.',
    category: 'tutorial',
    publishedAt: '2026-05-01T09:00:00Z',
    readTime: 5,
    body: [
      p('Crear tu primera factura puede parecer intimidante, pero con Nexo Billing es un proceso de menos de 3 minutos. En esta guía te explicamos cada paso con detalle para que no te quede ninguna duda.'),
      h2('Paso 1: Accede al módulo de facturas'),
      p('Desde el dashboard principal, haz clic en "Facturas" en el menú lateral. Verás la lista de todas tus facturas (vacía al principio). Haz clic en el botón verde "+ Nueva factura" en la esquina superior derecha.'),
      h2('Paso 2: Selecciona o crea el cliente'),
      p('En el campo "Cliente", empieza a escribir el nombre de la empresa o persona. Nexo Billing buscará entre tus clientes guardados. Si es la primera vez, haz clic en "Añadir nuevo cliente" e introduce:'),
      ...bullets(['Nombre o razón social', 'NIF/CIF (obligatorio para Verifactu)', 'Dirección fiscal', 'Email (para envío automático)', 'Teléfono (opcional)']),
      p('El NIF es especialmente importante: sin él no podrás registrar la factura en la AEAT mediante Verifactu.'),
      h2('Paso 3: Añade las líneas de la factura'),
      p('Cada línea representa un servicio o producto facturado. Para cada línea indica:'),
      ...bullets(['Descripción del servicio (máx. 500 caracteres)', 'Cantidad (por defecto 1)', 'Precio unitario sin IVA', 'Tipo de IVA: 21%, 10%, 4% o 0%']),
      p('Nexo Billing calcula automáticamente el subtotal, la cuota de IVA y el total de la línea. Puedes añadir tantas líneas como necesites.'),
      h2('Paso 4: Configura fechas y número de serie'),
      p('La fecha de expedición es obligatoria. Por defecto aparece la fecha de hoy, pero puedes modificarla. El número de serie (por ejemplo "A-2026-0001") lo genera Nexo automáticamente de forma correlativa, cumpliendo con la normativa Verifactu.'),
      quote('Importante: una vez emitida la factura, el número no se puede cambiar. Si cometiste un error, deberás emitir una factura rectificativa.'),
      h2('Paso 5: Vista previa y emisión'),
      p('Antes de guardar, puedes hacer clic en "Vista previa PDF" para ver cómo quedará la factura con todos los datos, el QR de Verifactu y el texto legal obligatorio. Si todo es correcto, haz clic en "Emitir factura".'),
      h2('Paso 6: Envía al cliente'),
      p('Una vez emitida, tienes tres opciones para hacérsela llegar al cliente:'),
      ...numbered(['Por email: Nexo envía automáticamente un email con el PDF adjunto', 'Por WhatsApp: genera un enlace público y lo abre directamente en WhatsApp Web', 'Descarga el PDF: para enviarlo tú mismo por el canal que prefieras']),
      h2('¿Qué pasa con Verifactu?'),
      p('En el momento de emitir la factura, Nexo Billing la registra automáticamente en la AEAT a través de Verifacti. Verás el estado "Enviado a AEAT" junto con el código CSV en la ficha de la factura. No necesitas hacer nada adicional.'),
      p('¿Tienes alguna duda? Escríbenos a contacto@nexo-digital.app y te ayudamos en minutos.'),
    ],
  },

  // ────────────────────────────────────────
  // TUTORIAL 2
  // ────────────────────────────────────────
  {
    _type: 'post',
    title: 'Cómo gestionar presupuestos y convertirlos en facturas',
    slug: { _type: 'slug', current: 'gestionar-presupuestos-convertir-facturas' },
    excerpt: 'Crea presupuestos profesionales, gestiona sus estados y conviértelos en facturas con un clic. Ahorra tiempo y nunca pierdas un presupuesto aceptado.',
    category: 'tutorial',
    publishedAt: '2026-05-03T09:00:00Z',
    readTime: 6,
    body: [
      p('Un presupuesto es la propuesta comercial que envías al cliente antes de que acepte el trabajo. Nexo Billing te permite gestionar todo el ciclo: creación, envío, seguimiento y conversión a factura.'),
      h2('¿Por qué usar presupuestos?'),
      p('El presupuesto no tiene validez fiscal, pero es la base de una buena relación comercial. Tener un historial de presupuestos te permite:'),
      ...bullets(['Calcular tu tasa de conversión (cuántos presupuestos se convierten en facturas)', 'Hacer seguimiento de propuestas pendientes de respuesta', 'Protegerte legalmente: el cliente acepta explícitamente el precio', 'Convertir a factura en un clic cuando el cliente dice "sí"']),
      h2('Crear un presupuesto'),
      p('Ve a Presupuestos → "Nuevo presupuesto". El proceso es idéntico al de crear una factura: seleccionas cliente, añades líneas y precios. La diferencia es que el documento se genera con cabecera "PRESUPUESTO" y numeración independiente (ej: P-2026-0001).'),
      p('Puedes configurar una validez: el presupuesto expira automáticamente tras el número de días que indiques (por defecto 30 días). Cuando expira, el estado cambia a "Caducado" y recibes una notificación.'),
      h2('Estados de un presupuesto'),
      p('Cada presupuesto pasa por estos estados:'),
      ...bullets(['Borrador: guardado pero no enviado', 'Enviado: el cliente ha recibido el presupuesto', 'Aceptado: el cliente ha confirmado', 'Rechazado: el cliente ha declinado', 'Caducado: superada la fecha de validez', 'Facturado: ya se convirtió en factura']),
      h2('Enviar el presupuesto al cliente'),
      p('Igual que con las facturas, puedes enviarlo por email con PDF adjunto o generar un enlace público. El cliente puede ver el presupuesto online y aceptarlo o rechazarlo directamente desde su móvil.'),
      h2('Convertir presupuesto en factura'),
      p('Esta es la funcionalidad más potente: cuando el cliente acepta, abre el presupuesto y haz clic en "Convertir a factura". Nexo Billing crea automáticamente una factura con todos los datos del presupuesto:'),
      ...bullets(['Mismo cliente y dirección fiscal', 'Mismas líneas y precios', 'Numeración de factura asignada automáticamente', 'Estado "Borrador" para que puedas revisar antes de emitir']),
      p('Solo tienes que confirmar la fecha de expedición y hacer clic en "Emitir". El presupuesto queda en estado "Facturado" y se vincula a la factura en el historial del cliente.'),
      h2('Historial del cliente'),
      p('En la ficha de cada cliente puedes ver todos sus presupuestos y facturas en un solo lugar. Esto te da una visión completa de la relación comercial: cuánto te debe, qué trabajos ha contratado y cuáles están pendientes de pago.'),
      quote('Consejo: configura un recordatorio automático a los 7 días para presupuestos en estado "Enviado". Muchos clientes olvidan responder y un recordatorio amable multiplica la tasa de conversión.'),
    ],
  },

  // ────────────────────────────────────────
  // TUTORIAL 3
  // ────────────────────────────────────────
  {
    _type: 'post',
    title: 'Cómo automatizar tus facturas recurrentes',
    slug: { _type: 'slug', current: 'automatizar-facturas-recurrentes' },
    excerpt: 'Si tienes clientes con servicios mensuales o anuales, las facturas recurrentes te ahorran horas de trabajo. Configúralas una vez y olvídate.',
    category: 'tutorial',
    publishedAt: '2026-05-05T09:00:00Z',
    readTime: 5,
    body: [
      p('Si tienes contratos de mantenimiento, cuotas mensuales o cualquier servicio recurrente, emitir la factura manualmente cada mes es un trabajo tedioso y propenso a errores. Nexo Billing automatiza este proceso completamente.'),
      h2('¿Qué es una factura recurrente?'),
      p('Una factura recurrente es una plantilla que genera automáticamente una nueva factura según la periodicidad que configures. Funciona como una suscripción: defines los datos una vez y el sistema se encarga de emitir la factura en la fecha correspondiente.'),
      h2('Casos de uso habituales'),
      ...bullets(['Mantenimiento mensual de instalaciones', 'Cuota de servicio de limpieza', 'Alquiler de local o maquinaria', 'Asesoría o consultoría por retainer', 'Suscripción a software o herramienta', 'Formación o coaching mensual']),
      h2('Cómo configurar una factura recurrente'),
      p('Ve a Facturas → "Recurrentes" → "Nueva recurrente". Sigue estos pasos:'),
      ...numbered(['Selecciona el cliente', 'Añade las líneas (igual que una factura normal)', 'Elige la periodicidad: mensual, trimestral, semestral o anual', 'Indica la fecha de inicio (cuándo se emite la primera)', 'Opcional: fecha de fin (si el contrato tiene duración limitada)']),
      h2('Periodicidad disponible'),
      ...bullets(['Mensual: se emite el mismo día cada mes', 'Trimestral: cada 3 meses', 'Semestral: cada 6 meses', 'Anual: una vez al año']),
      p('Si el mes tiene menos días que el día configurado (por ejemplo, configuras el 31 y el mes tiene 30), la factura se emite el último día del mes.'),
      h2('Notificaciones'),
      p('Cuando se genera una nueva factura recurrente, Nexo te envía una notificación por email con el enlace directo a la factura. También el cliente recibe su copia automáticamente si tienes configurado el envío automático.'),
      h2('Pausar o cancelar'),
      p('Puedes pausar una recurrente en cualquier momento (útil si el cliente suspende el servicio temporalmente) o cancelarla definitivamente. Las facturas ya emitidas no se ven afectadas.'),
      quote('Caso real: una empresa de limpieza con 20 contratos mensuales ahorra más de 3 horas al mes solo en generación de facturas. Eso es más de 36 horas al año.'),
      h2('Verifactu y recurrentes'),
      p('Cada factura generada automáticamente se registra en la AEAT mediante Verifactu. No necesitas intervención manual: el sistema garantiza el encadenamiento hash correcto y el envío en tiempo real, aunque se genere a las 3 de la madrugada.'),
    ],
  },

  // ────────────────────────────────────────
  // TUTORIAL 4
  // ────────────────────────────────────────
  {
    _type: 'post',
    title: 'Cómo controlar tu tesorería como autónomo',
    slug: { _type: 'slug', current: 'controlar-tesoreria-autonomo' },
    excerpt: 'El módulo de tesorería de Nexo Billing te muestra de un vistazo el dinero que entra, el que sale y el que está pendiente de cobro. Toma decisiones con datos reales.',
    category: 'tutorial',
    publishedAt: '2026-05-07T09:00:00Z',
    readTime: 7,
    body: [
      p('La tesorería es el pulso financiero de tu negocio. Puedes tener muchas facturas emitidas, pero si no cobras a tiempo, el flujo de caja se resiente. Nexo Billing tiene un módulo de tesorería diseñado específicamente para autónomos y pequeñas empresas.'),
      h2('¿Qué es el flujo de caja?'),
      p('El flujo de caja (cash flow) es la diferencia entre el dinero que entra y el que sale en un período. Un autónomo con flujo de caja positivo tiene más cobros que pagos: puede pagar sus impuestos, proveedores y gastos sin tensiones. Uno con flujo negativo tiene problemas aunque facture mucho.'),
      h2('El panel de tesorería'),
      p('Accede a Tesorería desde el menú lateral. Verás cuatro bloques principales:'),
      ...bullets(['Cobros del mes: suma de facturas pagadas en el mes actual', 'Pendiente de cobro: facturas emitidas no pagadas aún', 'Pagos del mes: gastos registrados en el período', 'Saldo previsional: estimación de cierre de mes']),
      h2('Marcar facturas como cobradas'),
      p('Cuando un cliente te paga, ve a la factura correspondiente y haz clic en "Marcar como cobrada". Puedes registrar:'),
      ...bullets(['Fecha exacta de cobro', 'Forma de pago (transferencia, efectivo, tarjeta, domiciliación)', 'Parcial: si el cliente pagó solo una parte']),
      p('Con esta información, el módulo de tesorería tiene datos reales, no solo previsiones.'),
      h2('Alertas de vencimiento'),
      p('Nexo Billing te avisa automáticamente cuando una factura está próxima a vencer o ya ha vencido sin cobrar. Recibes:'),
      ...bullets(['Notificación 3 días antes del vencimiento', 'Alerta el día del vencimiento', 'Recordatorio semanal si sigue sin cobrar']),
      p('También puedes activar el envío automático de recordatorios al cliente desde la ficha de la factura.'),
      h2('Previsión mensual'),
      p('El gráfico de previsión muestra los cobros y pagos esperados para los próximos 3 meses, basándose en las facturas pendientes y los gastos recurrentes que has registrado. Es especialmente útil para:'),
      ...bullets(['Planificar el pago de impuestos trimestrales', 'Decidir si puedes asumir un nuevo gasto', 'Detectar meses con tensión de liquidez con antelación']),
      h2('Gastos y su impacto en tesorería'),
      p('Cuando registras un gasto en Nexo Billing, también aparece en el flujo de caja. Esto te da una visión completa: ingresos menos gastos igual a beneficio real. No solo lo que facturas, sino lo que queda después de pagar proveedores, suministros y servicios.'),
      quote('Truco: conecta tu cuenta bancaria (próximamente con Open Banking) para que los cobros se marquen automáticamente al detectar el ingreso. Sin trabajo manual.'),
    ],
  },

  // ────────────────────────────────────────
  // TUTORIAL 5
  // ────────────────────────────────────────
  {
    _type: 'post',
    title: 'Cómo preparar el Modelo 303 con Nexo Billing',
    slug: { _type: 'slug', current: 'preparar-modelo-303-nexo-billing' },
    excerpt: 'El Modelo 303 es la declaración trimestral del IVA. Nexo Billing lo calcula automáticamente a partir de tus facturas emitidas y recibidas, listo para presentar.',
    category: 'tutorial',
    publishedAt: '2026-05-09T09:00:00Z',
    readTime: 7,
    body: [
      p('El Modelo 303 es una de las obligaciones fiscales más frecuentes para autónomos y empresas. Se presenta cada trimestre y resume el IVA repercutido (el que cobras a tus clientes) menos el IVA soportado (el que pagas a tus proveedores). La diferencia es lo que debes ingresar a Hacienda (o lo que Hacienda te devuelve si soportaste más de lo que repercutiste).'),
      h2('¿Quién está obligado a presentar el 303?'),
      ...bullets(['Autónomos en régimen general de IVA (la mayoría)', 'Sociedades limitadas y anónimas', 'Profesionales con actividad sujeta a IVA', 'Arrendadores de inmuebles (en muchos casos)']),
      p('Si estás en recargo de equivalencia o en determinadas actividades exentas, tu situación puede ser diferente. Consulta con tu asesor.'),
      h2('Plazos de presentación'),
      ...bullets(['1T (enero-marzo): del 1 al 20 de abril', '2T (abril-junio): del 1 al 20 de julio', '3T (julio-septiembre): del 1 al 20 de octubre', '4T (octubre-diciembre): del 1 al 30 de enero del año siguiente']),
      h2('Cómo lo calcula Nexo Billing'),
      p('En el menú Impuestos → Modelo 303, selecciona el trimestre y Nexo hace el cálculo automáticamente:'),
      ...numbered(['Lee todas las facturas emitidas del período y suma el IVA repercutido por tipo (21%, 10%, 4%)', 'Lee todos los gastos registrados con IVA deducible y suma el IVA soportado', 'Calcula la cuota diferencial (repercutido - soportado)', 'Muestra el resumen listo para verificar y exportar']),
      h2('¿Qué datos necesitas tener bien registrados?'),
      p('Para que el cálculo sea correcto:'),
      ...bullets(['Facturas emitidas: deben estar con fecha de expedición en el trimestre correcto', 'Gastos: deben estar registrados con su factura de proveedor y el IVA indicado', 'Gastos con IVA parcialmente deducible (vehículos, móvil): configurados con el porcentaje correcto']),
      h2('Exportar para presentar en la AEAT'),
      p('Nexo genera un archivo XML compatible con el formato oficial de la AEAT para el Modelo 303. Puedes importarlo directamente en la sede electrónica de Hacienda. También genera un resumen en PDF para tu archivo.'),
      quote('Si tienes asesor fiscal, puedes exportar el resumen y enviárselo por email directamente desde Nexo Billing. Él se encarga de la presentación.'),
      h2('Errores frecuentes'),
      ...bullets(['No registrar gastos en el trimestre correcto: afecta al saldo de IVA soportado', 'Mezclar facturas de años distintos en el mismo trimestre', 'Olvidar facturas de proveedores por registrar']),
      p('Nexo te avisa si detecta facturas sin fecha de vencimiento o gastos sin IVA asignado, para que no se te escape ningún dato.'),
    ],
  },

  // ────────────────────────────────────────
  // TUTORIAL 6
  // ────────────────────────────────────────
  {
    _type: 'post',
    title: 'Cómo registrar y categorizar tus gastos',
    slug: { _type: 'slug', current: 'registrar-categorizar-gastos' },
    excerpt: 'Registrar los gastos correctamente te permite deducirlos en el 130 y el 303. Te explicamos cómo hacerlo en Nexo Billing y qué categorías son deducibles.',
    category: 'tutorial',
    publishedAt: '2026-05-11T09:00:00Z',
    readTime: 6,
    body: [
      p('Muchos autónomos se olvidan de registrar sus gastos y acaban pagando más impuestos de los necesarios. Nexo Billing tiene un módulo de gastos diseñado para que sea tan fácil como hacer una foto al ticket con el móvil.'),
      h2('¿Qué gastos son deducibles?'),
      p('En términos generales, son deducibles los gastos necesarios para desarrollar la actividad económica. Los más habituales:'),
      ...bullets(['Material de oficina y suministros', 'Teléfono y conexión a internet (afectación parcial)', 'Vehículo (si está afecto a la actividad, con limitaciones)', 'Software y herramientas digitales (como Nexo Billing)', 'Formación relacionada con la actividad', 'Gestoría y asesoría fiscal', 'Publicidad y marketing', 'Alquiler del local o despacho', 'Suministros del local (luz, agua)']),
      h2('Cómo registrar un gasto'),
      p('Ve a Gastos → "Nuevo gasto". Introduce:'),
      ...numbered(['Proveedor (o selecciona uno existente)', 'Número de factura del proveedor', 'Fecha de la factura', 'Importe sin IVA', 'Tipo de IVA (el que aparece en la factura)', 'Categoría (ver más abajo)', 'Adjunta la factura o ticket escaneado']),
      p('El adjunto es fundamental: la AEAT puede pedirte la factura original para justificar la deducción. Tener todo en Nexo Billing es como tener un archivador digital siempre ordenado.'),
      h2('Categorías de gasto'),
      p('Nexo Billing usa las categorías de la AEAT para el Modelo 130:'),
      ...bullets(['Consumos de explotación: materiales y suministros directos', 'Servicios exteriores: asesoría, marketing, transporte', 'Tributos: tasas municipales, licencias', 'Gastos de personal: si tienes empleados', 'Gastos financieros: intereses de préstamos', 'Amortizaciones: equipos informáticos, vehículos', 'Otros gastos: seguros, gastos de representación']),
      h2('Adjuntar ticket desde el móvil'),
      p('Con la app móvil de Nexo Billing (próximamente), podrás hacer foto a un ticket y el sistema extrae automáticamente el importe, la fecha y el proveedor con OCR. Por ahora, puedes subir el archivo desde el ordenador en los formatos PDF, JPG o PNG.'),
      h2('Impacto en el Modelo 130'),
      p('Todos los gastos registrados con categoría correcta se incluyen automáticamente en el cálculo del Modelo 130. Nexo suma los ingresos del trimestre, resta los gastos deducibles y calcula el rendimiento neto previo. Sobre ese rendimiento aplica el porcentaje de retención (20%) para determinar lo que debes pagar a Hacienda.'),
      quote('Recuerda: un gasto mal categorizado o sin factura adjunta puede convertirse en una sanción en caso de inspección. Mejor hacerlo bien desde el principio.'),
    ],
  },

  // ────────────────────────────────────────
  // FISCAL 1
  // ────────────────────────────────────────
  {
    _type: 'post',
    title: 'Qué es Verifactu y por qué es obligatorio desde 2027',
    slug: { _type: 'slug', current: 'que-es-verifactu-obligatorio-2027' },
    excerpt: 'Verifactu es el nuevo sistema de facturación obligatorio de la AEAT. Te explicamos qué es, quién está obligado, cuándo entra en vigor y cómo Nexo Billing te pone al día automáticamente.',
    category: 'fiscal',
    publishedAt: '2026-05-13T09:00:00Z',
    readTime: 8,
    body: [
      p('El sistema Verifactu es uno de los cambios legislativos más importantes en facturación española de los últimos años. Aprobado mediante el Real Decreto 1007/2023 y desarrollado por la Orden HAC/1177/2024, obliga a que los programas de facturación envíen cada factura a la AEAT en tiempo real, garantizando su trazabilidad e inmutabilidad.'),
      h2('¿Por qué se creó Verifactu?'),
      p('La AEAT detectó que una parte significativa del fraude fiscal se producía mediante la manipulación de facturas en los propios programas de facturación: facturas emitidas que no declaraban, facturas duplicadas con importes distintos, "dobles cajas" invisibles al fisco. Verifactu cierra esas vías de fraude al encadenar criptográficamente cada factura con las anteriores.'),
      h2('¿Cómo funciona técnicamente?'),
      p('Cada factura emitida por un SIF (Sistema Informático de Facturación) verificable genera:'),
      ...bullets(['Un hash SHA-256 que incluye los datos de la factura y el hash de la factura anterior', 'Un QR con URL de verificación en la sede de la AEAT', 'Un registro enviado en tiempo real a los servidores de Hacienda', 'Un código CSV (Código Seguro de Verificación) devuelto por la AEAT como confirmación']),
      p('Esta cadena criptográfica hace imposible modificar una factura ya registrada sin que la cadena se rompa y la anomalía sea detectable.'),
      h2('¿Quién está obligado?'),
      p('En principio, todos los empresarios y profesionales que emitan facturas y usen un programa de facturación. El calendario de obligatoriedad es:'),
      ...bullets(['2025-2026: período voluntario (ya pueden sumarse)', '1 de enero de 2027: obligatorio para nuevos obligados tributarios', '1 de julio de 2027: obligatorio para todos los contribuyentes']),
      p('Hay ciertas excepciones: empresas acogidas al SII (Suministro Inmediato de Información, para grandes empresas) tienen sus propias obligaciones. Y las empresas del País Vasco y Navarra siguen regímenes forales equivalentes (TicketBAI en el caso vasco).'),
      h2('¿Qué pasa si no cumples?'),
      p('Las sanciones son muy significativas:'),
      ...bullets(['Para el fabricante del software (Nexo): hasta 150.000€ por incumplimiento técnico', 'Para el usuario del software (tú): hasta 50.000€ si usas un programa que no cumple', 'Además, en caso de inspección, la falta de trazabilidad puede implicar responsabilidad adicional']),
      quote('Por eso en Nexo Billing el cumplimiento Verifactu no es opcional: está integrado en el núcleo del sistema y no puede desactivarse.'),
      h2('Cómo Nexo Billing lo gestiona'),
      p('Desde el momento en que emites una factura en Nexo Billing:'),
      ...numbered(['Se genera el hash encadenado automáticamente', 'La factura se envía a la AEAT a través de Verifacti (proveedor intermediario homologado)', 'La AEAT devuelve el estado de registro y el CSV', 'El QR de verificación queda integrado en el PDF de la factura', 'Todo queda registrado e inmutable en la base de datos']),
      p('Tú no tienes que hacer nada. Nexo Billing se ocupa de todo el proceso técnico y legal.'),
    ],
  },

  // ────────────────────────────────────────
  // FISCAL 2
  // ────────────────────────────────────────
  {
    _type: 'post',
    title: 'Guía completa del Modelo 130 para autónomos en estimación directa',
    slug: { _type: 'slug', current: 'guia-modelo-130-autonomos' },
    excerpt: 'El Modelo 130 es el pago fraccionado del IRPF para autónomos. Te explicamos qué es, cuándo presentarlo, cómo calcularlo y cómo Nexo Billing lo genera automáticamente.',
    category: 'fiscal',
    publishedAt: '2026-05-15T09:00:00Z',
    readTime: 9,
    body: [
      p('Si eres autónomo en régimen de estimación directa (normal o simplificada), tienes que presentar el Modelo 130 cada trimestre. Es el adelanto fraccionado del IRPF: pagas el 20% del beneficio del trimestre, para no tener que pagar todo en la declaración anual de la Renta.'),
      h2('¿Quién debe presentarlo?'),
      ...bullets(['Autónomos en estimación directa normal', 'Autónomos en estimación directa simplificada', 'Profesionales que NO tienen retención de IRPF en sus facturas (o la tienen en menos del 70% de sus clientes)']),
      p('Si tus clientes te retienen IRPF en más del 70% de tus facturas (ej: profesionales que trabajan solo con empresas), estás exonerado. En ese caso, la empresa ya adelanta tu IRPF vía la retención.'),
      h2('¿Cuándo se presenta?'),
      ...bullets(['1T: del 1 al 20 de abril', '2T: del 1 al 20 de julio', '3T: del 1 al 20 de octubre', '4T: del 1 al 30 de enero del año siguiente']),
      p('Los mismos plazos que el Modelo 303 del IVA. Si el día 20 cae en fin de semana o festivo, el plazo se prorroga al siguiente día hábil.'),
      h2('¿Cómo se calcula?'),
      p('La fórmula básica es:'),
      p('(Ingresos del año hasta el trimestre - Gastos deducibles del año hasta el trimestre) × 20% - Retenciones soportadas - Pagos fraccionados anteriores'),
      p('El resultado puede ser positivo (pagas) o negativo (no pagas en ese trimestre, pero el exceso no se devuelve hasta la Renta anual).'),
      h2('Diferencia con el Modelo 303'),
      p('Aunque se presentan en los mismos plazos, son impuestos distintos:'),
      ...bullets(['Modelo 303: IVA (impuesto sobre el valor añadido, repercutido al cliente)', 'Modelo 130: IRPF (impuesto sobre la renta, lo pagas tú sobre tu beneficio)']),
      p('Puedes tener una cuota de IVA a pagar y una cuota de IRPF a cero (si tuviste pérdidas), o viceversa. Son independientes.'),
      h2('Cómo lo gestiona Nexo Billing'),
      p('En Impuestos → Modelo 130, Nexo calcula automáticamente el rendimiento neto del período usando tus facturas emitidas (ingresos) y los gastos que has registrado (gastos deducibles). Además:'),
      ...bullets(['Acumula automáticamente los trimestres anteriores del mismo año', 'Resta las retenciones de IRPF soportadas en tus facturas', 'Resta los pagos fraccionados ya presentados', 'Genera un resumen exportable para tu asesor o para importar en la AEAT']),
      h2('¿Qué pasa si no presento el 130?'),
      p('La falta de presentación del Modelo 130 conlleva:'),
      ...bullets(['Sanción fija de 200€ por declaración no presentada', 'Recargo del 20% si se presenta fuera de plazo con cuota a ingresar', 'En caso de inspección, pueden exigir el pago de todos los trimestres no presentados con recargos e intereses']),
      quote('Si en algún trimestre el resultado es negativo (pérdidas), igual tienes que presentar el 130 aunque la cuota sea cero. La declaración negativa o cero también debe presentarse.'),
    ],
  },

  // ────────────────────────────────────────
  // SEO
  // ────────────────────────────────────────
  {
    _type: 'post',
    title: 'Las 5 mejores apps de facturación para autónomos españoles en 2026',
    slug: { _type: 'slug', current: 'mejores-apps-facturacion-autonomos-espana-2026' },
    excerpt: 'Comparamos Holded, Billin, Contasimple, Factura Directa y Nexo Billing para que elijas la app de facturación que mejor se adapta a tus necesidades como autónomo en España.',
    category: 'seo',
    publishedAt: '2026-05-17T09:00:00Z',
    readTime: 10,
    body: [
      p('En 2026, el mercado de software de facturación para autónomos y PYMES en España está más competido que nunca. La llegada de Verifactu en 2027 ha obligado a todos los proveedores a actualizar sus sistemas para cumplir con la nueva normativa de la AEAT. Aquí analizamos las 5 opciones más populares con sus ventajas, limitaciones y precios.'),
      h2('Criterios de comparación'),
      p('Hemos evaluado cada app en base a:'),
      ...bullets(['Cumplimiento Verifactu (obligatorio desde 2027)', 'Facilidad de uso (sin conocimientos contables)', 'Precio mensual (plan para autónomo individual)', 'Funciones incluidas en el plan básico', 'Soporte y documentación en español']),
      h2('1. Holded'),
      p('Holded es probablemente el ERP más conocido del mercado español para PYMES. Tiene un diseño moderno y cubre prácticamente todas las áreas: facturación, contabilidad, inventario, proyectos y CRM.'),
      ...bullets(['✅ Interfaz moderna e intuitiva', '✅ Integración con bancos (Open Banking)', '✅ Contabilidad automatizada', '❌ Precio elevado para autónomos (desde 24€/mes en plan básico)', '❌ Verifactu: en desarrollo (anunciado pero no disponible aún en todos los planes)', '❌ Curva de aprendizaje alta para quienes solo necesitan facturar']),
      p('Ideal para: PYMES con varios empleados y necesidades de ERP completo.'),
      h2('2. Billin'),
      p('Billin está pensado específicamente para autónomos y pequeñas empresas que quieren una solución sencilla. Su punto fuerte es la simplicidad y el precio competitivo.'),
      ...bullets(['✅ Muy fácil de usar', '✅ Plan gratuito con funciones básicas', '✅ App móvil funcional', '❌ Funciones avanzadas (recurrentes, tesorería) solo en planes de pago', '❌ Verifactu: implementación parcial, sin confirmación de cobertura total', '❌ Limitaciones de personalización']),
      p('Ideal para: autónomos con bajo volumen de facturas que buscan lo básico gratis.'),
      h2('3. Contasimple'),
      p('Contasimple lleva muchos años en el mercado y tiene una base sólida de usuarios. Su principal atractivo es el módulo fiscal integrado y la compatibilidad con gestorías.'),
      ...bullets(['✅ Módulos fiscales completos (303, 130, 347, 390)', '✅ Muy usada por gestorías', '✅ Exportación en formato oficial AEAT', '❌ Diseño desactualizado', '❌ Verifactu: implementación anunciada pero sin fecha firme', '❌ UX poco intuitiva para usuarios sin experiencia contable']),
      p('Ideal para: autónomos que trabajan con gestoría y quieren coordinación directa.'),
      h2('4. Factura Directa'),
      p('Factura Directa es una opción sólida y bien valorada, especialmente entre autónomos de servicios. Tiene buena reputación en soporte y actualizaciones constantes.'),
      ...bullets(['✅ Buen equilibrio funciones/precio', '✅ Soporte telefónico en español', '✅ Gestión de clientes y presupuestos', '❌ Sin módulo de tesorería avanzado', '❌ Verifactu: en desarrollo, sin confirmación de disponibilidad en 2026', '❌ Sin app móvil nativa completa']),
      p('Ideal para: autónomos de servicios con volumen medio que valoran el soporte.'),
      h2('5. Nexo Billing'),
      p('Nexo Billing es la única plataforma de esta comparativa diseñada desde cero con Verifactu integrado en el núcleo del sistema. No es una adaptación de un sistema existente, sino una arquitectura pensada para el cumplimiento desde el primer día.'),
      ...bullets(['✅ Verifactu nativo: cada factura se registra en la AEAT en tiempo real', '✅ QR AEAT integrado en todos los PDFs', '✅ Encadenamiento hash automático (SHA-256)', '✅ Presupuestos, recurrentes, gastos y tesorería incluidos', '✅ Diseño moderno y UI en español', '✅ Multi-vertical: módulos especializados para limpieza, construcción, médicos', '✅ Precio competitivo para autónomos', '❌ Plataforma nueva (menos historial que los competidores)', '❌ Sin integración bancaria aún (en roadmap 2026)']),
      h2('Tabla comparativa'),
      p('Verifactu nativo: Nexo ✅ | Holded ⚠️ | Billin ⚠️ | Contasimple ⚠️ | Factura Directa ⚠️'),
      p('Presupuestos: Nexo ✅ | Holded ✅ | Billin ✅ | Contasimple ✅ | Factura Directa ✅'),
      p('Recurrentes: Nexo ✅ | Holded ✅ | Billin ❌ | Contasimple ✅ | Factura Directa ✅'),
      p('Tesorería: Nexo ✅ | Holded ✅ | Billin ❌ | Contasimple ❌ | Factura Directa ❌'),
      p('Modelos fiscales: Nexo ✅ | Holded ✅ | Billin ❌ | Contasimple ✅ | Factura Directa ❌'),
      h2('¿Cuál elegir en 2026?'),
      p('Si tu prioridad es el cumplimiento Verifactu y no quieres sorpresas en 2027, Nexo Billing es la única opción de esta lista con implementación completa y probada en producción. Si ya usas Holded y estás satisfecho, espera a que confirmen la cobertura Verifactu completa. Si solo necesitas lo básico gratis, Billin puede ser suficiente por ahora, aunque tendrás que migrar antes de 2027.'),
      quote('La elección del software de facturación es una decisión que puede costarte cara si tienes que migrar en el último momento. Hacerlo ahora, con tiempo, es mucho más fácil que el verano de 2027.'),
    ],
  },
]

async function main() {
  console.log(`Conectando con proyecto ${projectId}...`)
  let created = 0
  let skipped = 0

  for (const post of posts) {
    const existing = await client.fetch(
      `*[_type == "post" && slug.current == $slug][0]._id`,
      { slug: post.slug.current },
    )

    if (existing) {
      console.log(`⏭ Skipped: ${post.slug.current}`)
      skipped++
      continue
    }

    await client.create(post)
    console.log(`✅ Created: ${post.slug.current}`)
    created++
  }

  console.log(`\nFinalizado: ${created} creados, ${skipped} ya existían`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
