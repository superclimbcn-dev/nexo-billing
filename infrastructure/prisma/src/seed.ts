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

  const verticalConstruction = await prisma.vertical.upsert({
    where: { slug: 'construction' },
    update: {},
    create: {
      slug: 'construction',
      name: 'Construcción y carpintería',
      description: 'Carpintería industrial, ebanistería, instalación de puertas, ventanas y muebles a medida',
      status: 'active',
      modulesEnabled: ['projects', 'materials'],
      cnaeMapping: ['3109', '4332', '1623'],
      iconName: '🔨',
      color: '#f59e0b',
      sortOrder: 2,
    },
  })

  console.log(`  ✓ Verticals: ${verticalCleaning.name}, ${verticalGeneric.name}, ${verticalConstruction.name}`)

  // ── 1b. CATALOGO GLOBAL — Construcción y carpintería (uso diario) ─────────
  const constructionProducts = [
    // Materiales básicos
    { name: 'Cemento Portland 25kg', description: 'Cemento Portland gris tipo CEM II para obra general', unitPrice: 4.5, unit: 'saco', category: 'materiales' },
    { name: 'Mortero de albañilería 25kg', description: 'Mortero premezclado para ladrillo y bloque', unitPrice: 3.8, unit: 'saco', category: 'materiales' },
    { name: 'Yeso en polvo 25kg', description: 'Yeso de acabado para interior, alisado de paredes y techos', unitPrice: 5.2, unit: 'saco', category: 'materiales' },
    { name: 'Escayola 25kg', description: 'Escayola para molduras, techos desmontables y reparaciones', unitPrice: 6.0, unit: 'saco', category: 'materiales' },
    { name: 'Cal hidratada 25kg', description: 'Cal apagada para morteros, revocos y pintura de cal', unitPrice: 3.2, unit: 'saco', category: 'materiales' },
    { name: 'Arena de construcción', description: 'Arena lavada de río para morteros y hormigón', unitPrice: 18.0, unit: 'ton', category: 'materiales' },
    { name: 'Grava 20kg', description: 'Grava de trituración para hormigón y drenajes', unitPrice: 2.8, unit: 'saco', category: 'materiales' },
    { name: 'Ladrillo hueco doble', description: 'Ladrillo perforado doble para muros de carga y tabiques', unitPrice: 0.45, unit: 'ud', category: 'materiales' },
    { name: 'Ladrillo macizo', description: 'Ladrillo macizo para muros de carga y fachadas', unitPrice: 0.55, unit: 'ud', category: 'materiales' },
    { name: 'Bloque de hormigón 20x20x40', description: 'Bloque de hormigón vibrado para muros y cerramientos', unitPrice: 1.2, unit: 'ud', category: 'materiales' },
    { name: 'Placa de yeso laminado Pladur 120x260x13', description: 'Placa de yeso estándar para techos y tabiques', unitPrice: 6.5, unit: 'ud', category: 'pladur' },
    { name: 'Placa de yeso hidrófugo 120x260x13', description: 'Placa de yeso resistente a la humedad para baños y cocinas', unitPrice: 9.8, unit: 'ud', category: 'pladur' },
    { name: 'Placa de cemento 120x260', description: 'Placa de fibrocemento para exteriores y zonas húmedas', unitPrice: 22.0, unit: 'ud', category: 'materiales' },
    { name: 'Pasta de juntas Pladur 5kg', description: 'Pasta lista para juntas de pladur, acabado liso', unitPrice: 4.5, unit: 'bote', category: 'pladur' },
    { name: 'Cinta de papel para juntas 50m', description: 'Cinta de papel reforzada para juntas de pladur', unitPrice: 3.2, unit: 'rollo', category: 'pladur' },

    // Siliconas y selladores
    { name: 'Silicona acética transparente 280ml', description: 'Silicona universal transparente para sellado general', unitPrice: 2.8, unit: 'cartucho', category: 'selladores' },
    { name: 'Silicona acética blanca 280ml', description: 'Silicona universal blanca para cocinas, baños y carpintería', unitPrice: 2.8, unit: 'cartucho', category: 'selladores' },
    { name: 'Silicona neutra gris 280ml', description: 'Silicona neutra para exterior, no corroe metales', unitPrice: 4.2, unit: 'cartucho', category: 'selladores' },
    { name: 'Silicona sanitaria (baños) 280ml', description: 'Silicona antihongos para juntas de baño y cocina', unitPrice: 5.5, unit: 'cartucho', category: 'selladores' },
    { name: 'Sellador acrílico pintable 300ml', description: 'Sellador de acrílico para grietas y juntas, pintable al agua', unitPrice: 2.2, unit: 'cartucho', category: 'selladores' },
    { name: 'Sellador de poliuretano 300ml', description: 'Sellador elástico de poliuretano para juntas de dilatación', unitPrice: 5.8, unit: 'cartucho', category: 'selladores' },
    { name: 'Espuma de poliuretano 750ml', description: 'Espuma expansiva para sellado de huecos y fijación', unitPrice: 4.5, unit: 'bote', category: 'selladores' },
    { name: 'Masilla acrílica tubo 400ml', description: 'Masilla lista para rellenar grietas y agujeros, pintable', unitPrice: 3.5, unit: 'tubo', category: 'selladores' },
    { name: 'Masilla de poliéster bicomponente 1kg', description: 'Masilla de poliester con catalizador para reparaciones', unitPrice: 8.5, unit: 'bote', category: 'selladores' },

    // Pinturas
    { name: 'Pintura plástica blanca mate 15L', description: 'Pintura plástica de calidad para interior y exterior', unitPrice: 28.0, unit: 'bote', category: 'pinturas' },
    { name: 'Pintura plástica blanca mate 4L', description: 'Pintura plástica blanca mate para paredes y techos', unitPrice: 12.5, unit: 'bote', category: 'pinturas' },
    { name: 'Imprimación al agua 4L', description: 'Imprimación de fijación para paredes nuevas o reparadas', unitPrice: 15.0, unit: 'bote', category: 'pinturas' },
    { name: 'Barniz mate para madera 750ml', description: 'Barniz protector incoloro con acabado mate para madera', unitPrice: 9.5, unit: 'bote', category: 'pinturas' },
    { name: 'Barniz brillante para madera 750ml', description: 'Barniz protector incoloro con acabado brillante', unitPrice: 9.5, unit: 'bote', category: 'pinturas' },
    { name: 'Esmalte al agua blanco 750ml', description: 'Esmalte sintético al agua para metales y madera', unitPrice: 8.0, unit: 'bote', category: 'pinturas' },
    { name: 'Pintura de tráfico 4L', description: 'Pintura acrílica para señalización horizontal en parking', unitPrice: 32.0, unit: 'bote', category: 'pinturas' },
    { name: 'Pintura de suelos epoxi 4kg', description: 'Pintura epoxi bicomponente para suelos industriales', unitPrice: 45.0, unit: 'bote', category: 'pinturas' },
    { name: 'Pintura impermeabilizante 15L', description: 'Pintura impermeabilizante para terrazas y cubiertas', unitPrice: 55.0, unit: 'bote', category: 'pinturas' },
    { name: 'Fijador al agua 5L', description: 'Fijador sellador para paredes antes de pintar', unitPrice: 12.0, unit: 'bote', category: 'pinturas' },
    { name: 'Enduido en pasta 5kg', description: 'Pasta de alisado para paredes, acabado liso', unitPrice: 8.5, unit: 'bote', category: 'pinturas' },
    { name: 'Disolvente universal 1L', description: 'Disolvente multiusos para limpieza de herramientas', unitPrice: 3.5, unit: 'bote', category: 'pinturas' },

    // Adhesivos
    { name: 'Cola blanca para madera 1kg', description: 'Cola blanca D2 para ensamblaje de madera', unitPrice: 4.5, unit: 'bote', category: 'adhesivos' },
    { name: 'Cola de contacto 1L', description: 'Cola de contacto neopreno para laminados y moquetas', unitPrice: 8.0, unit: 'bote', category: 'adhesivos' },
    { name: 'Cemento cola flexible 25kg', description: 'Cemento cola C2 TE S1 para cerámica y gres porcelánico', unitPrice: 12.5, unit: 'saco', category: 'adhesivos' },
    { name: 'Cemento cola normal 25kg', description: 'Cemento cola C1 para baldosas y azulejos en interior', unitPrice: 7.5, unit: 'saco', category: 'adhesivos' },
    { name: 'Masilla epoxi 1kg', description: 'Masilla epoxi para relleno de juntas anchas en suelos', unitPrice: 18.0, unit: 'bote', category: 'adhesivos' },

    // Ferretería y tornillería
    { name: 'Taco Fischer SX8 (caja 100)', description: 'Taco de expansión universal para hormigón y ladrillo', unitPrice: 6.5, unit: 'caja', category: 'ferretería' },
    { name: 'Taco Fischer SX10 (caja 100)', description: 'Taco de expansión universal Ø10 para cargas medias', unitPrice: 9.5, unit: 'caja', category: 'ferretería' },
    { name: 'Taco Fischer DUOPOWER 8x40 (caja 100)', description: 'Taco dual para hormigón, ladrillo y pladur', unitPrice: 12.0, unit: 'caja', category: 'ferretería' },
    { name: 'Tornillo autoperforante 4.2x16 (caja 1000)', description: 'Tornillo autotaladrante para chapa de acero hasta 2mm', unitPrice: 8.5, unit: 'caja', category: 'ferretería' },
    { name: 'Tornillo autoperforante 4.8x38 (caja 1000)', description: 'Tornillo autotaladrante para fijación de panel sándwich', unitPrice: 11.0, unit: 'caja', category: 'ferretería' },
    { name: 'Tornillo para madera 4x40 (caja 500)', description: 'Tornillo de rosca metrica para madera', unitPrice: 5.5, unit: 'caja', category: 'ferretería' },
    { name: 'Tornillo para madera 5x60 (caja 500)', description: 'Tornillo de rosca metrica para estructuras de madera', unitPrice: 7.5, unit: 'caja', category: 'ferretería' },
    { name: 'Tornillo para aglomerado 4x40 (caja 500)', description: 'Tornillo avellanado para tableros de aglomerado y DM', unitPrice: 5.0, unit: 'caja', category: 'ferretería' },
    { name: 'Clavo galvanizado 40mm (kg)', description: 'Clavo de acero galvanizado para carpintería general', unitPrice: 3.2, unit: 'kg', category: 'ferretería' },
    { name: 'Clavo galvanizado 60mm (kg)', description: 'Clavo de acero galvanizado para estructuras ligeras', unitPrice: 3.5, unit: 'kg', category: 'ferretería' },
    { name: 'Brida nylon 200x4.8 (caja 100)', description: 'Brida de nylon para agrupación de cables y tubos', unitPrice: 2.5, unit: 'caja', category: 'ferretería' },
    { name: 'Brida nylon 300x4.8 (caja 100)', description: 'Brida de nylon grande para instalaciones industriales', unitPrice: 3.5, unit: 'caja', category: 'ferretería' },
    { name: 'Tornillo Pladur 3.5x25 (caja 1000)', description: 'Tornillo autorroscante para fijación de pladur a perfil', unitPrice: 7.0, unit: 'caja', category: 'ferretería' },
    { name: 'Tornillo Pladur 3.5x45 (caja 1000)', description: 'Tornillo autorroscante largo para doble placa de pladur', unitPrice: 8.5, unit: 'caja', category: 'ferretería' },
    { name: 'Varilla roscada M8 (1m)', description: 'Varilla roscada zincada para estructuras y suspensión', unitPrice: 2.5, unit: 'ud', category: 'ferretería' },
    { name: 'Varilla roscada M10 (1m)', description: 'Varilla roscada zincada M10 para cargas pesadas', unitPrice: 3.5, unit: 'ud', category: 'ferretería' },
    { name: 'Tuerca hexagonal M8 (caja 100)', description: 'Tuerca hexagonal zincada para varilla roscada', unitPrice: 3.0, unit: 'caja', category: 'ferretería' },
    { name: 'Arandela plana M8 (caja 100)', description: 'Arandela plana zincada para distribución de carga', unitPrice: 1.5, unit: 'caja', category: 'ferretería' },
    { name: 'Anclaje químico M10 (caja 10)', description: 'Anclaje químico con resina para fijaciones estructurales', unitPrice: 18.0, unit: 'caja', category: 'ferretería' },
    { name: 'Resina de anclaje 300ml', description: 'Resina de poliéster para anclajes químicos en hormigón', unitPrice: 12.0, unit: 'cartucho', category: 'ferretería' },

    // Electricidad
    { name: 'Cable eléctrico H07RN-F 3x1.5 (metro)', description: 'Cable flexible para instalaciones provisionales y obra', unitPrice: 1.8, unit: 'm', category: 'electricidad' },
    { name: 'Cable eléctrico H07RN-F 3x2.5 (metro)', description: 'Cable flexible para alimentación de maquinaria', unitPrice: 2.8, unit: 'm', category: 'electricidad' },
    { name: 'Tubo corrugado 16mm (rollo 50m)', description: 'Tubo corrugado para instalación de cables eléctricos', unitPrice: 18.0, unit: 'rollo', category: 'electricidad' },
    { name: 'Tubo corrugado 20mm (rollo 50m)', description: 'Tubo corrugado Ø20 para instalaciones con más cables', unitPrice: 25.0, unit: 'rollo', category: 'electricidad' },
    { name: 'Caja de empotrar universal', description: 'Caja de empotrar para mecanismos eléctricos', unitPrice: 0.45, unit: 'ud', category: 'electricidad' },
    { name: 'Interruptor simple empotrable', description: 'Mecanismo de interruptor simple para caja de empotrar', unitPrice: 2.5, unit: 'ud', category: 'electricidad' },
    { name: 'Enchufe Schuko empotrable', description: 'Base de enchufe Schuko con protección para niños', unitPrice: 3.5, unit: 'ud', category: 'electricidad' },
    { name: 'Foco LED empotrable 7W', description: 'Foco downlight LED empotrable para techos de pladur', unitPrice: 4.5, unit: 'ud', category: 'electricidad' },
    { name: 'Foco LED empotrable 9W', description: 'Foco downlight LED empotrable de mayor potencia', unitPrice: 5.5, unit: 'ud', category: 'electricidad' },
    { name: 'Tubo LED T8 120cm 18W', description: 'Tubo LED sustituto de fluorescente 36W', unitPrice: 5.5, unit: 'ud', category: 'electricidad' },
    { name: 'Panel LED 60x60cm 40W', description: 'Panel LED para techos desmontables 60x60', unitPrice: 22.0, unit: 'ud', category: 'electricidad' },
    { name: 'Proyector LED 30W', description: 'Foco proyector LED para exterior e industrial', unitPrice: 18.0, unit: 'ud', category: 'electricidad' },
    { name: 'Regleta con interruptor 3 tomas', description: 'Regleta de 3 enchufes con interruptor y protección', unitPrice: 6.5, unit: 'ud', category: 'electricidad' },
    { name: 'Cable prolongación Schuko 5m', description: 'Prolongador eléctrico 5 metros con protección', unitPrice: 8.5, unit: 'ud', category: 'electricidad' },
    { name: 'Cable prolongación Schuko 10m', description: 'Prolongador eléctrico 10 metros con protección', unitPrice: 14.0, unit: 'ud', category: 'electricidad' },

    // Fontanería
    { name: 'Tubo PVC evacuación Ø110 (3m)', description: 'Tubo de PVC para saneamiento y evacuación de aguas', unitPrice: 8.5, unit: 'ud', category: 'fontanería' },
    { name: 'Tubo PVC evacuación Ø50 (3m)', description: 'Tubo de PVC Ø50 para desagües de lavabos y fregaderos', unitPrice: 3.5, unit: 'ud', category: 'fontanería' },
    { name: 'Codo PVC 90º Ø110', description: 'Codo de PVC a 90 grados para cambio de dirección', unitPrice: 3.2, unit: 'ud', category: 'fontanería' },
    { name: 'Válvula de esfera 1/2"', description: 'Válvula de esfera palanca para corte de agua', unitPrice: 4.5, unit: 'ud', category: 'fontanería' },
    { name: 'Válvula de esfera 3/4"', description: 'Válvula de esfera palanca 3/4 para contadores', unitPrice: 5.5, unit: 'ud', category: 'fontanería' },
    { name: 'Grifo monomando lavabo', description: 'Grifo monomando cromado para lavabo con ahorro de agua', unitPrice: 35.0, unit: 'ud', category: 'fontanería' },
    { name: 'Grifo monomando cocina', description: 'Grifo monomando cromado para fregadero de cocina', unitPrice: 42.0, unit: 'ud', category: 'fontanería' },
    { name: 'Flexo de ducha 1.5m', description: 'Flexo de ducha cromado antitorsión 1.5 metros', unitPrice: 8.5, unit: 'ud', category: 'fontanería' },
    { name: 'Sifón botella lavabo', description: 'Sifón botella cromado para lavabo con válvula', unitPrice: 12.0, unit: 'ud', category: 'fontanería' },
    { name: 'Sifón extensible fregadero', description: 'Sifón extensible para fregadero con toma de lavadora', unitPrice: 15.0, unit: 'ud', category: 'fontanería' },
    { name: 'Llave de paso con purga 1/2"', description: 'Llave de paso con purga para vaciado de instalaciones', unitPrice: 6.5, unit: 'ud', category: 'fontanería' },

    // Herramientas manuales
    { name: 'Martillo de albañil 500g', description: 'Martillo con mango de fibra de vidrio para albañilería', unitPrice: 8.5, unit: 'ud', category: 'herramientas' },
    { name: 'Cúter profesional 18mm', description: 'Cúter retráctil de aluminio con depósito de cuchillas', unitPrice: 5.5, unit: 'ud', category: 'herramientas' },
    { name: 'Nivel de burbuja 80cm', description: 'Nivel de aluminio con 3 burbujas para horizontal y vertical', unitPrice: 12.0, unit: 'ud', category: 'herramientas' },
    { name: 'Cinta métrica 5m', description: 'Flexómetro 5 metros con freno y gancho magnético', unitPrice: 6.5, unit: 'ud', category: 'herramientas' },
    { name: 'Llave ajustable 10"', description: 'Llave inglesa ajustable cromada 10 pulgadas', unitPrice: 9.5, unit: 'ud', category: 'herramientas' },
    { name: 'Alicate universal', description: 'Alicate universal mango bimaterial para electricidad', unitPrice: 7.5, unit: 'ud', category: 'herramientas' },
    { name: 'Destornillador Phillips PH2', description: 'Destornillador Phillips PH2 mango ergonómico', unitPrice: 3.5, unit: 'ud', category: 'herramientas' },
    { name: 'Llave Allen juego 10 piezas', description: 'Juego de llaves Allen hexagonales métricas con bola', unitPrice: 8.5, unit: 'juego', category: 'herramientas' },
    { name: 'Espátula 100mm', description: 'Espátula de acero inoxidable para alisado de masillas', unitPrice: 3.5, unit: 'ud', category: 'herramientas' },
    { name: 'Espátula 60mm', description: 'Espátula de acero inoxidable para masillas y selladores', unitPrice: 2.5, unit: 'ud', category: 'herramientas' },
    { name: 'Llana de acero 280x130mm', description: 'Llana de acero con mango de madera para alisado', unitPrice: 7.5, unit: 'ud', category: 'herramientas' },
    { name: 'Paleta de albañil 180x140', description: 'Paleta de acero mango madera para mortero', unitPrice: 6.5, unit: 'ud', category: 'herramientas' },
    { name: 'Sierra de calar manual', description: 'Arco de sierra para calar con hoja intercambiable', unitPrice: 12.0, unit: 'ud', category: 'herramientas' },
    { name: 'Cincel de albañil 250x16mm', description: 'Cincel de acero forjado para picado de hormigón', unitPrice: 8.5, unit: 'ud', category: 'herramientas' },
    { name: 'Carretilla 90L', description: 'Carretilla de obra con rueda neumática y cubeta 90L', unitPrice: 55.0, unit: 'ud', category: 'herramientas' },

    // Seguridad
    { name: 'Guantes de trabajo de nitrilo (pack 100)', description: 'Guantes desechables de nitrilo sin polvo talla M/L', unitPrice: 8.5, unit: 'pack', category: 'seguridad' },
    { name: 'Guantes de trabajo de cuero (par)', description: 'Guantes de cuero flor para trabajo pesado', unitPrice: 6.5, unit: 'par', category: 'seguridad' },
    { name: 'Gafas de seguridad transparentes', description: 'Gafas de protección contra proyecciones y polvo', unitPrice: 4.5, unit: 'ud', category: 'seguridad' },
    { name: 'Mascarilla desechable FFP2 (pack 20)', description: 'Mascarilla FFP2 con filtro de partículas', unitPrice: 6.0, unit: 'pack', category: 'seguridad' },
    { name: 'Casco de seguridad amarillo', description: 'Casco de obra con ajuste de rosca y barbiquejo', unitPrice: 8.5, unit: 'ud', category: 'seguridad' },
    { name: 'Botas de seguridad S3 (par)', description: 'Bota de seguridad con puntera y plantilla antiperforación', unitPrice: 35.0, unit: 'par', category: 'seguridad' },
    { name: 'Arnés de seguridad 4 puntos', description: 'Arnés anticaídas con 4 puntos de anclaje', unitPrice: 45.0, unit: 'ud', category: 'seguridad' },
    { name: 'Red de seguridad 2x10m', description: 'Red de protección perimetral para obras y andamios', unitPrice: 28.0, unit: 'ud', category: 'seguridad' },
    { name: 'Puntales metálicos 3m', description: 'Puntales metálicos para encofrado y soporte de cargas', unitPrice: 18.0, unit: 'ud', category: 'seguridad' },

    // Aislamiento
    { name: 'Lana de roca 60kg/m³ (placa)', description: 'Placa de lana de roca para aislamiento térmico y acústico', unitPrice: 8.5, unit: 'ud', category: 'aislamiento' },
    { name: 'Lana de vidrio 15kg/m³ (rollo)', description: 'Rollo de lana de vidrio para aislamiento de cubiertas', unitPrice: 12.0, unit: 'rollo', category: 'aislamiento' },
    { name: 'Poliestireno extruido XPS 50mm', description: 'Placa de poliestireno extruido para suelos y cubiertas', unitPrice: 15.0, unit: 'ud', category: 'aislamiento' },
    { name: 'Poliestireno expandido EPS 30mm', description: 'Placa de poliestireno expandido para fachadas', unitPrice: 6.5, unit: 'ud', category: 'aislamiento' },
    { name: 'Tela asfáltica 4mm (rollo 10m²)', description: 'Tela asfáltica con armadura para impermeabilización', unitPrice: 22.0, unit: 'rollo', category: 'aislamiento' },
    { name: 'Membrana EPDM (rollo 10m²)', description: 'Membrana de caucho EPDM para impermeabilización', unitPrice: 65.0, unit: 'rollo', category: 'aislamiento' },
    { name: 'Junta de dilatación 15mm (rollo 25m)', description: 'Perfil de junta de dilatación para pavimentos', unitPrice: 18.0, unit: 'rollo', category: 'aislamiento' },

    // Carpintería (productos a medida, menos frecuentes)
    { name: 'Puerta interior lacada blanca', description: 'Puerta de paso lacada en blanco, marco incluido', unitPrice: 185.0, unit: 'ud', category: 'carpintería' },
    { name: 'Puerta exterior blindada', description: 'Puerta de seguridad acorazada grado 3, cerradura multipunto', unitPrice: 520.0, unit: 'ud', category: 'carpintería' },
    { name: 'Ventana aluminio 2 hojas', description: 'Ventana corredera de aluminio con doble acristalamiento', unitPrice: 295.0, unit: 'ud', category: 'carpintería' },
    { name: 'Armario empotrado a medida', description: 'Interior de armario con barras, cajoneras y estantes a medida', unitPrice: 650.0, unit: 'ml', category: 'carpintería' },
    { name: 'Tarima flotante roble', description: 'Tarima flotante de roble natural, acabado aceitado', unitPrice: 42.0, unit: 'm²', category: 'carpintería' },
    { name: 'Cocina integral a medida', description: 'Muebles de cocina altos y bajos, encimera de cuarzo incluida', unitPrice: 4500.0, unit: 'proyecto', category: 'carpintería' },
  ]

  for (const p of constructionProducts) {
    await prisma.catalogItem.upsert({
      where: { verticalId_name: { verticalId: verticalConstruction.id, name: p.name } },
      update: {},
      create: {
        verticalId: verticalConstruction.id,
        name: p.name,
        description: p.description,
        unitPrice: new Prisma.Decimal(p.unitPrice),
        vatRate: new Prisma.Decimal(21),
        unit: p.unit,
        category: p.category,
        isActive: true,
      },
    })
  }

  console.log(`  ✓ Catalogo construcción: ${constructionProducts.length} productos`)

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
