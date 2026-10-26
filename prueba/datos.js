/* TEFES · ENTORNO DE PRUEBAS — base de datos de ejemplo en el navegador.
   Todo lo que hay aquí es inventado: tiendas reales por nombre, pero personas, clientes, ventas, conteos y pendientes
   son de ejemplo. Nada se envía a ningún servidor: los cambios quedan solo en este navegador (localStorage) y
   los tres niveles (administración, supervisores y tiendas) leen la misma base, como en la app real.
   La base imita las pestañas de las hojas de Google de la app; las pantallas la leen por rangos (A1). */
(function () {
  var KEY = 'tefesPrueba.v1';
  var VERSION = 4;

  /* ---------- utilidades ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function isoDe(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function hoyISO() { return isoDe(new Date()); }
  function sumar(iso, n) { var d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoDe(d); }
  function hm(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function haceMin(m) { var d = new Date(Date.now() - m * 60000); return isoDe(d) + ' ' + hm(d); }
  function lunes(iso) { var d = new Date(iso + 'T12:00:00'), w = (d.getDay() + 6) % 7; return sumar(iso, -w); }
  function semISO(iso) {
    var d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    var y = d.getFullYear(), e = new Date(y, 0, 4, 12); e.setDate(e.getDate() + 3 - (e.getDay() + 6) % 7);
    return y + '-S' + pad(1 + Math.round((d - e) / 6048e5));
  }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var R = rng(20261027);
  function ent(a, b) { return a + Math.floor(R() * (b - a + 1)); }
  function de(arr) { return arr[Math.floor(R() * arr.length)]; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function txt(v) { return v == null ? '' : String(v); }

  /* ---------- catálogo fijo ---------- */
  var TIENDAS = [
    // nombre, ciudad, original (opera desde el inicio), presupuesto mensual de ejemplo
    ['Mall Sol', 'Guayaquil', true, 78000], ['Urdesa', 'Guayaquil', true, 52000], ['Samborondón', 'Guayaquil', true, 61000],
    ['Mall Jardín', 'Quito', false, 38000], ['Scala', 'Quito', false, 30000], ['Tumbaco', 'Quito', false, 24000],
    ['Megakywi', 'Quito', false, 27000], ['Megamaxi', 'Quito', false, 34000], ['Condado', 'Quito', false, 33000], ['Portal', 'Quito', false, 29000]];
  var SUPERVISORES = [
    ['Paula Andrade', 'Mall Sol, Urdesa, Samborondón', 'Seguimiento'],
    ['Martín Cevallos', 'Condado, Portal, Megakywi, Scala', 'Seguimiento'],
    ['Gabriela Toapanta', 'Mall Jardín, Tumbaco, Megamaxi', 'Seguimiento'],
    ['Lucía Herrera', 'Todas', 'Lectura']];
  var ADMIN = 'Administrador';
  var NOMBRES = ['Andrés', 'Carla', 'Daniela', 'Esteban', 'Fernanda', 'Gustavo', 'Isabel', 'Jorge', 'Karina', 'Luis', 'María', 'Nicolás', 'Olga', 'Pablo', 'Rosa',
    'Santiago', 'Tatiana', 'Víctor', 'Ximena', 'Bruno', 'Camila', 'Diana', 'Emilio', 'Fabiola', 'Hugo', 'Irene', 'Joaquín', 'Lorena', 'Mateo', 'Natalia', 'Óscar',
    'Patricia', 'Ramiro', 'Silvia', 'Tomás', 'Valeria', 'Wilson', 'Yolanda', 'Adriana', 'Bernardo', 'Cecilia', 'Darío', 'Elena', 'Franco', 'Gloria', 'Iván'];
  var APELLIDOS = ['Aguirre', 'Benítez', 'Calderón', 'Delgado', 'Espinoza', 'Freire', 'Guerrero', 'Hidalgo', 'Iturralde', 'Jaramillo', 'León', 'Montalvo', 'Naranjo',
    'Ordóñez', 'Palacios', 'Quiroga', 'Rosales', 'Salazar', 'Tapia', 'Ulloa', 'Valencia', 'Yépez', 'Zambrano', 'Arteaga', 'Bustos', 'Cordero', 'Dávila', 'Endara',
    'Falconí', 'Garcés', 'Herrera', 'Intriago', 'Játiva', 'Lozada', 'Mera', 'Noboa', 'Orellana', 'Paz', 'Reinoso', 'Sotomayor', 'Terán', 'Vásconez'];
  var PRODUCTOS = [  // código, descripción, grupo, costo, precio
    ['CAB-HD20', 'Cable HDMI 4K de 2 m', 'CABLES', 4.1, 12.9], ['CAB-USC1', 'Cable USB-C a USB-C de 1 m', 'CABLES', 2.6, 8.5], ['CAB-LGT1', 'Cable Lightning a USB de 1 m', 'CABLES', 3.2, 10.9],
    ['CAB-RCA3', 'Cable 3 RCA a 3 RCA de 1,8 m', 'CABLES', 1.9, 6.5], ['CAB-AUX1', 'Cable auxiliar 3,5 mm de 1 m', 'CABLES', 1.2, 4.9], ['CAB-RJ45', 'Cable de red Cat 6 de 3 m', 'CABLES', 2.4, 7.9],
    ['AUD-BT10', 'Audífonos Bluetooth deportivos', 'AUDIO', 9.8, 29.9], ['AUD-TWS5', 'Audífonos TWS con estuche de carga', 'AUDIO', 12.5, 39.9], ['AUD-DIA2', 'Audífonos de diadema plegables', 'AUDIO', 8.2, 24.9],
    ['BOC-BT30', 'Bocina Bluetooth portátil 10 W', 'AUDIO', 14.6, 44.9], ['BOC-KAR8', 'Bocina karaoke con micrófono', 'AUDIO', 38.0, 109.0], ['MIC-LAV1', 'Micrófono de solapa para celular', 'AUDIO', 5.1, 16.9],
    ['CAR-150', 'Adaptador CarPlay inalámbrico', 'AUTO', 22.0, 64.9], ['CAR-USB2', 'Cargador de auto doble USB 3,4 A', 'AUTO', 3.5, 11.9], ['CAR-SOP3', 'Soporte magnético de celular para auto', 'AUTO', 3.9, 12.9],
    ['CAR-CAM1', 'Cámara de reversa para auto', 'AUTO', 16.5, 49.9], ['CEL-CRG20', 'Cargador de pared USB-C 20 W', 'CELULAR', 5.4, 17.9], ['CEL-PB10', 'Batería portátil 10 000 mAh', 'CELULAR', 8.9, 27.9],
    ['CEL-PB20', 'Batería portátil 20 000 mAh', 'CELULAR', 13.8, 39.9], ['CEL-TRI1', 'Trípode con aro de luz 26 cm', 'CELULAR', 9.6, 29.9], ['CEL-SEL2', 'Bastón selfie Bluetooth', 'CELULAR', 4.8, 14.9],
    ['CCTV-WF2', 'Cámara de seguridad Wi-Fi 2 MP', 'SEGURIDAD', 19.5, 59.9], ['CCTV-EXT', 'Cámara Wi-Fi para exterior', 'SEGURIDAD', 31.0, 89.9], ['CCTV-TIM', 'Timbre con cámara Wi-Fi', 'SEGURIDAD', 24.0, 69.9],
    ['SEG-CER1', 'Cerradura digital con huella', 'SEGURIDAD', 58.0, 159.0], ['SEG-SEN2', 'Sensor de puerta inteligente', 'SEGURIDAD', 6.2, 19.9], ['HOG-FOC9', 'Foco inteligente Wi-Fi RGB', 'HOGAR', 4.6, 14.9],
    ['HOG-ENC1', 'Enchufe inteligente Wi-Fi', 'HOGAR', 5.0, 15.9], ['HOG-TIR5', 'Tira LED RGB de 5 m', 'HOGAR', 7.4, 22.9], ['HOG-REG6', 'Regleta con 6 tomas y USB', 'HOGAR', 6.8, 19.9],
    ['COM-MOU2', 'Mouse inalámbrico recargable', 'COMPUTO', 4.4, 13.9], ['COM-TEC3', 'Teclado inalámbrico compacto', 'COMPUTO', 8.1, 24.9], ['COM-HUB7', 'Hub USB-C 7 en 1', 'COMPUTO', 11.6, 34.9],
    ['COM-WEB1', 'Cámara web Full HD', 'COMPUTO', 12.9, 37.9], ['COM-MEM64', 'Memoria USB de 64 GB', 'COMPUTO', 3.7, 11.9], ['COM-SSD5', 'Disco SSD externo 512 GB', 'COMPUTO', 39.0, 104.9],
    ['RED-RPT3', 'Repetidor Wi-Fi 300 Mbps', 'REDES', 9.1, 27.9], ['RED-RTR6', 'Router Wi-Fi 6 doble banda', 'REDES', 27.0, 79.9], ['RED-ADP1', 'Adaptador USB Wi-Fi', 'REDES', 4.2, 12.9],
    ['TV-SOP55', 'Soporte de pared para TV 32" a 55"', 'TV', 9.4, 29.9], ['TV-CON4', 'Control remoto universal', 'TV', 3.3, 10.9], ['TV-ANT2', 'Antena digital para TV', 'TV', 6.7, 19.9],
    ['TV-STK4', 'Reproductor de streaming 4K', 'TV', 24.5, 69.9], ['HER-MUL1', 'Multímetro digital', 'HERRAMIENTAS', 7.9, 23.9], ['HER-CAU3', 'Cautín de 40 W con base', 'HERRAMIENTAS', 5.6, 16.9],
    ['HER-LIN2', 'Linterna recargable LED', 'HERRAMIENTAS', 4.9, 15.9], ['GAM-CTR1', 'Control inalámbrico para PC y celular', 'GAMER', 11.2, 32.9], ['GAM-AUD7', 'Audífonos gamer con luz RGB', 'GAMER', 13.4, 39.9],
    ['GAM-MPD2', 'Mouse pad gamer XL', 'GAMER', 4.3, 12.9], ['PIL-AA4', 'Pilas recargables AA (4)', 'ENERGIA', 6.1, 18.9], ['PIL-CRG2', 'Cargador de pilas AA/AAA', 'ENERGIA', 5.2, 15.9],
    ['ENE-UPS6', 'UPS de 600 VA', 'ENERGIA', 32.0, 89.9], ['ENE-INV3', 'Inversor de corriente para auto 300 W', 'ENERGIA', 18.0, 52.9], ['DRN-MIN1', 'Mini dron con cámara', 'DRONES', 29.0, 84.9],
    ['RLJ-SMT2', 'Reloj inteligente deportivo', 'WEARABLES', 18.5, 54.9], ['RLJ-BND1', 'Banda de actividad física', 'WEARABLES', 9.9, 29.9], ['PRO-LAS1', 'Puntero láser presentador', 'OFICINA', 7.0, 21.9],
    ['PRO-MIN2', 'Mini proyector LED', 'OFICINA', 45.0, 129.0], ['TEL-INL1', 'Teléfono inalámbrico', 'OFICINA', 14.0, 39.9], ['ACC-LIM1', 'Kit de limpieza para pantallas', 'ACCESORIOS', 1.6, 5.9]];
  var POLITICAS = [
    ['P001', 'Política de despachos', -7, 'Cómo traer de otra tienda un producto vendido y cuánto cuesta el envío'],
    ['P002', 'Política de faltantes de inventario', -4, 'Cómo se manejan y cobran los faltantes y sobrantes de los inventarios de la tienda'],
    ['P003', 'Órdenes de trabajo (Servicio Técnico)', -5, 'Cómo clasificar, registrar y despachar las órdenes de servicio técnico'],
    ['P004', 'Garantías, cambios y notas de crédito', -5, 'Qué cubre la garantía y cuándo aplica un cambio o una nota de crédito'],
    ['P005', 'Publicidad y material en tienda', -5, 'Solo se exhibe publicidad oficial o con visto bueno escrito del Corporativo'],
    ['P006', 'Política de consumidor final', -5, 'Evitar facturas a consumidor final; con ellas no hay cambio ni nota de crédito']];
  var PREGUNTAS = {  // tres preguntas de ejemplo por política; la correcta es la letra
    P001: [['Tu tienda no tiene el producto y otra tienda sí. ¿Cómo lo pides?', 'Por teléfono y por correo a la tienda origen', 'Solo por WhatsApp al gerente de la otra tienda', 'Le pides al cliente que vaya a la otra tienda', 'A'],
      ['¿Qué es la tienda origen?', 'La tienda que atiende al cliente', 'La tienda que tiene el producto y lo envía', 'La tienda que factura al cliente', 'B'],
      ['¿Quién hace la transferencia en el sistema?', 'La tienda destino', 'La bodega central', 'La tienda origen', 'C']],
    P002: [['¿Cada cuánto se hace el Muestreo Top 50?', 'Cada semana', 'Cada mes', 'Cada año', 'A'], ['¿Qué pasa con un faltante sin explicación?', 'Se ignora', 'Se revisa y puede descontarse al equipo', 'Lo paga el supervisor', 'B'], ['¿Quién explica las diferencias?', 'La tienda, antes de enviar el conteo', 'El cliente', 'Nadie', 'A']],
    P003: [['¿Dónde se registra una orden de servicio técnico?', 'En el sistema, con los datos del cliente', 'En una hoja suelta', 'No se registra', 'A'], ['¿Qué se entrega al cliente?', 'Nada', 'El comprobante de la orden', 'Solo un recibo verbal', 'B'], ['¿Quién despacha el equipo al taller?', 'El cliente', 'La tienda, según el proceso', 'El supervisor', 'B']],
    P004: [['¿Qué necesita el cliente para una garantía?', 'La factura de compra', 'Nada', 'Una foto del producto', 'A'], ['¿La garantía cubre golpes?', 'Sí, siempre', 'No, cubre defectos de fábrica', 'Solo los lunes', 'B'], ['¿Cuándo aplica una nota de crédito?', 'Siempre que el cliente quiera', 'Según la política y con factura a su nombre', 'Nunca', 'B']],
    P005: [['¿Qué publicidad se puede exhibir?', 'La oficial o aprobada por escrito', 'Cualquiera', 'La que traiga un proveedor', 'A'], ['¿Quién aprueba material no oficial?', 'El asesor', 'El Corporativo, por escrito', 'El cliente', 'B'], ['¿Se puede pegar material en vidrios sin aprobación?', 'Sí', 'No', 'Solo en diciembre', 'B']],
    P006: [['¿Se recomienda facturar a consumidor final?', 'Sí, siempre', 'No, hay que pedir los datos del cliente', 'Da igual', 'B'], ['Con factura a consumidor final, ¿hay cambio?', 'Sí', 'No', 'Solo con el supervisor', 'B'], ['¿Qué datos se piden?', 'Nombre y cédula o RUC', 'Solo el nombre', 'Ninguno', 'A']]};
  var PUNTOS = [
    ['A01', 'A', 'Fachada y rótulos limpios, visibles y en buen estado. Mamparas y ventanales limpios.', 'Siempre'], ['A02', 'A', 'Iluminación exterior e interior en correcto funcionamiento.', 'Si es 0 o 1'],
    ['A03', 'A', 'Limpieza general del piso de venta, perchas, counter, mobiliario y productos.', 'Siempre'], ['A04', 'A', 'Computadores, impresoras y teléfonos del local limpios y operativos.', 'Si es 0 o 1'],
    ['A05', 'A', 'Bodega limpia, ordenada, segura y rotulada por secciones.', 'Siempre'], ['A06', 'A', 'Local en condiciones adecuadas de mantenimiento y funcionamiento general.', 'Si es 0 o 1'],
    ['A07', 'A', 'Espacios vacíos con elementos gráficos o soluciones visuales aprobadas.', 'Si es 0 o 1'], ['A08', 'A', 'Control de suministros de oficina, limpieza y cafetería.', 'Si es 0 o 1'],
    ['A09', 'A', 'Comedor y utensilios de limpieza limpios, ordenados y en buen estado.', 'Si es 0 o 1'], ['A10', 'A', 'Baño en óptimas condiciones de limpieza, orden e higiene.', 'Si es 0 o 1'],
    ['A11', 'A', 'Counter y puntos de venta limpios, ordenados y con el material POP vigente.', 'Siempre'],
    ['B01', 'B', 'Aparadores y exhibición mensual según la campaña vigente.', 'Siempre'], ['B02', 'B', 'Mesa de experiencia configurada, completa y operativa.', 'Siempre'],
    ['B03', 'B', 'Artes de la mesa de experiencia completos y vigentes.', 'Si es 0 o 1'], ['B04', 'B', 'Productos touch & feel conectados y funcionales.', 'Si es 0 o 1'],
    ['B05', 'B', 'Exhibición de mercadería correcta, sin duplicados ni espacios vacíos.', 'Siempre'], ['B06', 'B', 'Producto de impulso de la semana o del mes correctamente exhibido.', 'Si es 0 o 1'],
    ['B07', 'B', 'Precios completos, vigentes, legibles y con portaprecios en buen estado.', 'Si es 0 o 1'], ['B08', 'B', 'Descuentos y ofertas correctamente identificados.', 'Si es 0 o 1'],
    ['B09', 'B', 'Pantalla corporativa encendida y con contenido vigente.', 'Si es 0 o 1'],
    ['C01', 'C', 'Equipo con acceso y avance en Universidad Steren.', 'Siempre', 'Sí'], ['C02', 'C', 'Calculadora de objetivos y productividad implementada y actualizada.', 'Si es 0 o 1'],
    ['C03', 'C', 'Pizarra o comunicación de productividad actualizada.', 'Siempre'], ['C04', 'C', 'Venta total vs. objetivo revisada durante la visita.', 'Opcional', 'Sí'],
    ['C05', 'C', 'Ticket promedio revisado vs. objetivo.', 'Opcional', 'Sí'], ['C06', 'C', 'Artículos por ticket revisados vs. objetivo (1,8).', 'Opcional', 'Sí'],
    ['C07', 'C', 'Venta de garantía extendida gestionada activamente.', 'Si es 0 o 1'], ['C08', 'C', 'Venta de producto de impulso gestionada activamente.', 'Opcional'],
    ['C09', 'C', 'Servicio de instalaciones ofrecido donde aplique.', 'Opcional'],
    ['D01', 'D', 'Gerente, subgerente y asesores con buena presentación y credencial.', 'Si es 0 o 1'], ['D02', 'D', 'Horarios revisados y cobertura adecuada de apertura y cierre.', 'Si es 0 o 1'],
    ['D03', 'D', 'Super Coach configurado y operativo.', 'Si es 0 o 1'], ['D04', 'D', 'Modelo IDC ejecutado en tiempo real.', 'Opcional'],
    ['D05', 'D', 'Sistema de Servicio Técnico instalado y operativo.', 'Si es 0 o 1'], ['D06', 'D', 'El equipo conoce las políticas vigentes.', 'Opcional'],
    ['E01', 'E', 'Nivel de stock adecuado, sin excesos críticos ni quiebres relevantes.', 'Si es 0 o 1'], ['E02', 'E', 'Caja chica y caja general correctamente controladas.', 'Si es 0 o 1'],
    ['E03', 'E', 'Caja, formas de pago, timbrado y lector de tarjetas funcionando.', 'Si es 0 o 1'], ['E04', 'E', 'Transferencias de mercadería al día, sin pendientes de más de una semana.', 'Si es 0 o 1'],
    ['F01', 'F', 'Muestreo Top 50 enviado a tiempo.', 'Automático'], ['F02', 'F', 'Exactitud del Muestreo Top 50.', 'Automático']];
  var SECCIONES = [['A', 'Imagen, limpieza y mantenimiento', '0.15'], ['B', 'Merchandising, exhibición y precios', '0.15'], ['C', 'Ventas y productividad del equipo', '0.25'],
    ['D', 'Servicio, personal y operación', '0.1'], ['E', 'Inventarios, caja y control interno', '0.1'], ['F', 'Muestreo Top 50', '0.25']];
  var HALLAZGOS = {
    A: ['Vidrios de la mampara con marcas de manos al abrir.', 'Dos focos fundidos en la zona de audio.', 'Polvo en perchas de cables y en la parte alta de las góndolas.', 'Bodega con cajas en el pasillo de circulación.', 'Counter con papeles y guías de despacho a la vista.'],
    B: ['Exhibición de la campaña del mes incompleta.', 'Mesa de experiencia con dos equipos apagados.', 'Seis productos sin precio en la percha de celulares.', 'Producto de impulso fuera de la caja.', 'Ofertas sin rótulo en la góndola de entrada.'],
    C: ['Pizarra de productividad sin actualizar desde la semana pasada.', 'Ticket promedio por debajo del objetivo de $35.', 'Dos asesores sin avance en Universidad Steren este mes.', 'No se ofrece garantía extendida en las ventas observadas.'],
    D: ['Un asesor sin credencial visible.', 'Horario semanal no publicado en la pizarra.', 'En dos atenciones no se aplicó el modelo IDC completo.'],
    E: ['Tres productos de alta rotación en quiebre de stock.', 'Transferencia pendiente de hace 10 días con bodega.', 'Diferencia de $4,50 en el arqueo de caja chica.']};
  var ACCIONES = {
    A: 'Limpiar y dejar el área según el estándar antes de la apertura. Subir foto del área resuelta.', B: 'Completar la exhibición según el lineamiento vigente y colocar precios. Subir foto.',
    C: 'Revisar con el equipo el avance diario frente al objetivo y actualizar la pizarra. Enviar evidencia.', D: 'Reforzar con el equipo el estándar de servicio y presentación. Enviar evidencia.',
    E: 'Gestionar con bodega y dejar el caso respaldado por correo. Adjuntar evidencia.'};
  var CARGOS = ['Gerente de tienda', 'Subgerente de tienda', 'Asesor comercial', 'Asesor comercial', 'Asesor comercial'];

  /* ---------- generar la base ---------- */
  function generar() {
    R = rng(20261027);
    var hoy = hoyISO(), ayer = sumar(hoy, -1), ahora = new Date();
    var T = {}, usados = {};
    function persona() { for (;;) { var n = de(NOMBRES) + ' ' + de(APELLIDOS); if (!usados[n]) { usados[n] = 1; return n; } } }
    SUPERVISORES.forEach(function (s) { usados[s[0]] = 1; });

    T['Tiendas'] = [['Tienda', 'Activa', 'Gerente', 'Notas']];
    T['Claves'] = [['Tienda', 'Token']];
    T['Personal'] = [['Nombre completo', 'Tienda', 'Departamento (ERP)', 'Ciudad', 'Cargo', 'Fecha de ingreso', 'Estado']];
    T['Contactos'] = [['Tienda', 'Ciudad', 'Correo', 'Teléfono', 'WhatsApp', 'Dirección', 'Horario', 'Nota']];
    var equipo = {};
    TIENDAS.forEach(function (t, i) {
      var gente = CARGOS.slice(0, t[2] ? 5 : 4).map(function (c) { return [persona(), c]; });
      equipo[t[0]] = gente;
      T['Tiendas'].push([t[0], 'Sí', gente[0][0], 'Tienda de ejemplo']);
      T['Claves'].push([t[0], 'prueba-' + t[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')]);
      gente.forEach(function (g) { T['Personal'].push([g[0], t[0], 'STEREN ' + t[0].toUpperCase(), t[1], g[1], sumar(hoy, -ent(40, 700)), 'Activo']); });
      T['Contactos'].push([t[0], t[1], 'tienda' + (i + 1) + '@ejemplo.test', '04 000 00' + pad(i + 1), '09 0000 00' + pad(i + 1), 'Centro comercial de ejemplo, local ' + (10 + i), 'Lunes a domingo 10:00 a 21:00', '']);
    });
    T['Claves'].push(['__PANEL__', 'prueba-panel'], ['__INVENTARIO__', 'prueba-inventario']);
    T['Supervisores'] = [['Nombre', 'Código', 'Tiendas', 'Permiso', 'Activo']].concat(SUPERVISORES.map(function (s, i) { return [s[0], 'S' + (i + 1), s[1], s[2], 'Sí']; }));
    T['Config'] = [['Clave', 'Valor', 'Descripción'],
      ['URL_APP', SITIO, 'Dirección del entorno de pruebas.'], ['DIAS_COMPROMISO', '7', 'Días por defecto para la fecha compromiso de un pendiente.'],
      ['DIAS_AUTOSUPERVISION', '7', 'Cada cuántos días debe hacer la tienda su autosupervisión.'], ['MAX_FOTOS_POR_PUNTO', '3', 'Máximo de fotos por punto.'], ['NOTIF_MODO', 'Apagado', 'En pruebas no se envían correos.']];
    T['Secciones'] = [['Código', 'Sección', 'Peso']].concat(SECCIONES);
    T['Puntos'] = [['ID', 'Código sección', 'Sección', 'Punto de control', 'Criterio / guía', 'Foto', 'Qué fotografiar', 'Dato de apoyo obligatorio']].concat(PUNTOS.map(function (p) {
      var s = SECCIONES.filter(function (x) { return x[0] === p[1]; })[0];
      return [p[0], p[1], s[1], p[2], 'Criterio de ejemplo para evaluar este punto.', p[3], p[3] === 'Automático' ? '' : 'Foto del punto evaluado.', p[4] || 'No'];
    }));
    T['Textos'] = [['Tipo', 'Texto'], ['Solicitud', 'Falta la foto después. Sube una foto que muestre el punto resuelto.'], ['Solicitud', 'La foto no muestra el punto resuelto. Sube una foto clara del área completa.'],
      ['Solicitud', 'Indica la fecha exacta en que quedará resuelto y quién es el responsable.'], ['Solicitud', 'El comentario no explica qué se hizo. Describe la acción realizada.'],
      ['Aprobación', 'Validado con la evidencia enviada.'], ['Aprobación', 'Validado. Buen trabajo del equipo.'], ['Aprobación', 'Validado. Se revisará nuevamente en la próxima visita.'],
      ['Acción correctiva', 'Limpiar mampara, vidrios y rótulo antes de la apertura. Subir foto de la fachada limpia.'],
      ['Acción correctiva', 'Retirar los productos duplicados en percha y completar los espacios según el planograma vigente.'],
      ['Acción correctiva', 'Revisar con el equipo el avance diario frente al objetivo y definir la meta diaria por asesor en la pizarra.']];

    /* supervisiones y pendientes */
    T['Supervisiones'] = [['ID', 'Tienda', 'Tipo', 'Fecha', 'Hora inicio', 'Hora fin', 'Realizada por', 'Gerente', 'Subadministrador', 'Personas en local', '% A Imagen', '% B Merchandising', '% C Ventas', '% D Servicio', '% E Inventarios', 'Puntaje total', 'Resultado', 'Cumple (2)', 'Parcial (1)', 'Incumple (0)', 'N/A', 'Pendientes generados', 'Comentario general', 'Registrado', 'Informe PDF', 'Duración (min)', 'Tiempo por sección (min)', '% F Muestreo Top 50']];
    T['Pendientes'] = [['ID', 'ID supervisión', 'Tienda', 'Fecha supervisión', 'Origen', 'ID punto', 'Sección', 'Punto de control', 'Calificación', 'Hallazgo', 'Acción correctiva', 'Responsable', 'Fecha compromiso', 'Prioridad', 'Estado', 'Foto antes', 'Foto después', 'Comentario tienda', 'Fecha resuelto', 'Fecha cierre', 'Comentario supervisor', 'Actualizado', 'Historial']];
    var nSup = 0, nPend = 0;
    function supDe(t) { return SUPERVISORES.filter(function (s) { return s[2] === 'Seguimiento' && s[1].split(',').map(function (x) { return x.trim(); }).indexOf(t) >= 0; })[0][0]; }
    TIENDAS.forEach(function (t, ti) {
      var g = equipo[t[0]], base = [0.9, 0.93, 0.85, 0.78, 0.81, 0.69, 0.84, 0.87, 0.8, 0.73][ti];
      var visitas = [];
      // supervisiones del supervisor: cada ~2 semanas (una tienda con más de 30 días sin visita, para la demo)
      var ultima = ti === 5 ? 36 : ent(2, 12);
      for (var k = 0; k < 4; k++) visitas.push(['Supervisión', sumar(hoy, -(ultima + k * ent(12, 16))), supDe(t[0])]);
      // autosupervisiones semanales del gerente (una tienda atrasada)
      for (var w = ti === 7 ? 2 : 0; w < 6; w++) visitas.push(['Autosupervisión', sumar(hoy, -(w * 7 + ent(0, 2))), g[0][0]]);
      visitas.sort(function (a, b) { return a[1] < b[1] ? -1 : 1; });
      visitas.forEach(function (v) {
        nSup++;
        var id = 'S' + String(1000 + nSup), auto = v[0] === 'Autosupervisión', mejora = (sumar(hoy, -70) < v[1] ? 0.03 : 0);
        var secs = SECCIONES.map(function (s, i) { if (s[0] === 'F' && auto) return ''; var x = Math.min(1, Math.max(0.5, base + mejora + (auto ? 0.02 : 0) + (R() - 0.5) * 0.16)); return r2(x); });
        var pesos = SECCIONES.map(function (s) { return Number(s[2]); }), suma = 0, sp = 0;
        secs.forEach(function (x, i) { if (x !== '') { suma += x * pesos[i]; sp += pesos[i]; } });
        var total = r2(suma / sp), res = total >= 0.9 ? 'Óptimo' : total >= 0.71 ? 'Plan de trabajo' : 'Contención';
        var pend = [];
        if (!auto && v[1] >= sumar(hoy, -45)) {
          var malos = PUNTOS.filter(function (p) { return p[3] !== 'Automático' && R() < (1 - total) * 0.55; }).slice(0, 7);
          malos.forEach(function (p) { pend.push(p); });
        }
        var ini = ent(9, 11), dur = auto ? ent(35, 70) : ent(110, 200);
        T['Supervisiones'].push([id, t[0], v[0], v[1], pad(ini) + ':' + pad(ent(0, 5) * 10), pad(ini + Math.floor(dur / 60)) + ':' + pad(dur % 60), v[2], g[0][0], g[1][0], String(ent(2, 4)),
          secs[0], secs[1], secs[2], secs[3], secs[4], total, res, String(ent(25, 34)), String(ent(2, 6)), String(pend.length), String(ent(0, 2)), String(pend.length),
          auto ? 'Autosupervisión de ejemplo.' : 'Visita de ejemplo del entorno de pruebas.', v[1] + ' ' + pad(ini + 2) + ':10', '', String(dur), '', secs[5]]);
        pend.forEach(function (p, j) {
          nPend++;
          var pid = 'P' + String(5000 + nPend), sec = SECCIONES.filter(function (s) { return s[0] === p[1]; })[0];
          var dias = Math.round((new Date(hoy) - new Date(v[1])) / 864e5), fcomp = sumar(v[1], 7), resp = de(g)[0];
          var est = dias > 14 ? (R() < 0.85 ? 'Cerrado' : 'Pendiente') : de(['Pendiente', 'Pendiente', 'En proceso', 'Por validar', 'Por validar', 'Reabierto', 'Cerrado']);
          var h = [v[1] + ' ' + pad(ini + 1) + ':' + pad(10 + j) + ' · Creado por ' + v[2]], comT = '', fres = '', fcie = '', comS = '';
          var t1 = sumar(v[1], Math.min(ent(2, 5), Math.max(dias - 1, 0)));
          if (est === 'En proceso') { comT = 'Ya coordinamos con el equipo, lo dejamos listo esta semana.'; h.push(t1 + ' 16:20 · En proceso (' + resp + '): ' + comT); }
          if (est === 'Por validar' || est === 'Cerrado' || est === 'Reabierto') { comT = 'Listo, se corrigió. Adjuntamos foto.'; fres = t1; h.push(t1 + ' 17:05 · Por validar (' + resp + '): ' + comT + ' [1 foto(s)]'); }
          if (est === 'Reabierto') { comS = 'La foto no muestra el punto resuelto. Sube una foto clara del área completa.'; h.push(sumar(t1, 1) + ' 10:30 · Reabierto (' + v[2] + ' · supervisor): ' + comS); fcomp = sumar(t1, 4); }
          if (est === 'Cerrado') { fcie = sumar(t1, 1); comS = 'Validado con la evidencia enviada.'; h.push(fcie + ' 11:00 · Cerrado (' + v[2] + ' · supervisor): ' + comS); }
          T['Pendientes'].push([pid, id, t[0], v[1], 'Supervisión', p[0], sec[1], p[2], R() < 0.4 ? '0' : '1', de(HALLAZGOS[p[1]] || ['Hallazgo de ejemplo.']), ACCIONES[p[1]] || 'Corregir según el estándar.',
            resp, fcomp, R() < 0.25 ? 'Alta' : 'Media', est, FOTO, comT && est !== 'En proceso' ? FOTO : '', comT, fres, fcie, comS, (fcie || fres || v[1]) + ' 12:00', h.join('\n')]);
        });
      });
    });

    /* anuncios, políticas, guías, actividades */
    var todasPersonas = T['Personal'].slice(1);
    function lecturas(tab, id, desde, prob) {
      todasPersonas.forEach(function (p) { if (R() < prob) T[tab].push([sumar(desde, ent(0, 2)), pad(ent(9, 19)) + ':' + pad(ent(0, 59)), id, p[1], p[0], p[4]]); });
    }
    var lun = lunes(hoy);
    T['Anuncios'] = [['ID', 'Desde', 'Hasta', 'Tiendas', 'Título', 'Qué hacer', 'Activo', 'Efecto'],
      ['A001', lun, sumar(lun, 6), 'Todas', 'Campaña de la semana: audio portátil', 'Exhibir bocinas y audífonos en la entrada y ofrecer la garantía extendida en cada venta.', 'Sí', ''],
      ['A002', sumar(lun, -7), sumar(lun, -1), 'Todas', 'Inventario Top 50 de la semana', 'Contar los 50 productos de la lista hasta el miércoles y explicar cada diferencia.', 'Sí', ''],
      ['A003', lun, sumar(lun, 6), 'Mall Sol, Urdesa, Samborondón', 'Visita del Corporativo', 'Tener la mesa de experiencia completa y la bodega ordenada.', 'Sí', '']];
    T['Lecturas de anuncios'] = [['Fecha', 'Hora', 'Anuncio', 'Tienda', 'Persona', 'Cargo']];
    lecturas('Lecturas de anuncios', 'A001', lun, 0.55); lecturas('Lecturas de anuncios', 'A002', sumar(lun, -7), 0.9);
    T['Políticas'] = [['ID', 'Título', 'Publicada', 'Tiendas', 'Activo', 'Resumen']].concat(POLITICAS.map(function (p) { return [p[0], p[1], sumar(hoy, p[2]), 'Todas', 'Sí', p[3]]; }));
    T['Textos de políticas'] = [['ID', 'HTML', 'Versión']].concat(POLITICAS.map(function (p) {
      return [p[0], '<p class="pol-lead">' + p[3] + '.</p><h5>Texto de ejemplo</h5><p>Este es un texto de ejemplo del entorno de pruebas. En la app real aquí va la política completa, con sus pasos, responsables y casos.</p>' +
        '<ol class="pol-pasos"><li>Lee la política con calma.</li><li>Pregunta a tu gerente si algo no está claro.</li><li>Responde las 3 preguntas para aprobarla.</li></ol>', '1'];
    }));
    T['Preguntas de políticas'] = [['Política', 'N°', 'Pregunta', 'Opción A', 'Opción B', 'Opción C', 'Correcta']];
    Object.keys(PREGUNTAS).forEach(function (k) { PREGUNTAS[k].forEach(function (q, i) { T['Preguntas de políticas'].push([k, String(i + 1)].concat(q)); }); });
    T['Lecturas de políticas'] = [['Fecha', 'Hora', 'Política', 'Tienda', 'Persona', 'Cargo', 'Aciertos', 'Resultado']];
    POLITICAS.forEach(function (p, i) {
      todasPersonas.forEach(function (x) {
        var r = R(); if (r < 0.62 - i * 0.07) T['Lecturas de políticas'].push([sumar(hoy, p[2] + ent(0, 3)), pad(ent(9, 19)) + ':' + pad(ent(0, 59)), p[0], x[1], x[0], x[4], '3', 'Aprobó']);
        else if (r < 0.7 - i * 0.07) T['Lecturas de políticas'].push([sumar(hoy, p[2] + ent(0, 3)), pad(ent(9, 19)) + ':' + pad(ent(0, 59)), p[0], x[1], x[0], x[4], '2', 'No aprobó']);
      });
    });
    T['Lecturas de políticas supervisores'] = [['Fecha', 'Hora', 'Política', 'Persona', 'Resultado']];
    POLITICAS.slice(0, 4).forEach(function (p) { SUPERVISORES.slice(0, 2).forEach(function (s) { T['Lecturas de políticas supervisores'].push([sumar(hoy, p[2] + 1), '10:00', p[0], s[0], 'Aprobó']); }); });
    T['Guías'] = [['ID', 'Título', 'Resumen', 'Enlace', 'Publicada', 'Tiendas', 'Activo', 'Tipo', 'Para'],
      ['G001', 'Ventas futuras', 'Qué hacer cuando un cliente pide un producto que no tenemos: registrarlo y avisarle cuando llegue.', GUIA_VF, sumar(hoy, -3), 'Todas', 'Sí', 'Guía', 'Tiendas'],
      ['G004', 'Apertura y cierre de la tienda', 'Lista de pasos de ejemplo para abrir y cerrar el local.', GUIA_VF, sumar(hoy, -10), 'Todas', 'Sí', 'Manual', 'Tiendas'],
      ['G002', 'Manual de procesos de Servicio Técnico', 'Recepción del CEDIS, transferencias, revisión en MB51 y órdenes de trabajo (RPC, PND, G50). Gerentes y subgerentes responden 5 preguntas.', GUIA_MPT, sumar(hoy, -1), 'Todas', 'Sí', 'Guía', 'Tiendas'],
      ['G003', 'Cómo hacer una supervisión', 'Manual de ejemplo para supervisores.', HOJA_PDF, sumar(hoy, -12), 'Todas', 'Sí', 'Manual', 'Supervisores']];
    T['Preguntas de guías'] = [["Guía", "N°", "Pregunta", "Opción A", "Opción B", "Opción C", "Correcta"],
      ["G002", "1", "¿Quién puede hacer una transferencia o recibir mercadería en el sistema?", "Cualquier asesor que tenga tiempo", "Solo el gerente o el subgerente con su propia clave", "El asesor con la clave prestada del gerente", "B"],
      ["G002", "2", "¿Qué referencia se pone en el MIGO al sacar un PND o un G50 hacia revisión?", "ST en mayúsculas", "El nombre del cliente", "TR y el mandante de Quito", "A"],
      ["G002", "3", "En una orden de Reparación de producto (RPC) del cliente ¿se hace MIGO?", "Sí siempre una salida 502", "Sí pero solo si vale más de $50", "No nunca: la tienda solo custodia el producto", "C"],
      ["G002", "4", "¿A dónde se despacha un Producto nuevo defectuoso (PND)?", "A Revisión y Desperfectos", "A la misma tienda que lo vendió", "Se queda en la bodega de la tienda", "A"],
      ["G002", "5", "Tienes tres audífonos iguales dañados para enviar como PND. ¿Cómo se registran en el MIGO?", "Una línea con cantidad 3", "Una unidad por línea y una orden por línea", "No se registran porque son del mismo código", "B"],
      ["G002", "6", "Un cliente trae un producto de $35 con factura a consumidor final. ¿Se puede hacer un G50?", "Sí porque vale menos de $50", "Sí si el gerente lo autoriza por WhatsApp", "No: G50 y RPC piden factura a nombre del cliente", "C"],
      ["G002", "7", "Tienes una orden RPC una PND y una G50 listas. ¿Cómo las despachas?", "En una sola caja con una guía", "En tres guías y tres cajas separadas por tipo", "PND y G50 juntas y RPC aparte", "B"],
      ["G002", "8", "Detectas 20 regletas iguales dañadas en la tienda. ¿Qué haces?", "Reportas a Diego y van a desperfectos con una TR autorizada sin órdenes de trabajo", "Haces 20 órdenes de trabajo PND", "Las devuelves a la percha hasta el próximo conteo", "A"],
      ["G002", "9", "En una transferencia de salida escribes 1 en Cantidad sin borrar el cero. ¿Qué pasa?", "Nada el sistema lo corrige", "Se registra 10 en lugar de 1", "El sistema no deja guardar", "B"],
      ["G002", "10", "¿Qué transacción del POS muestra todos los movimientos de un código para revisar que quedaron bien?", "MIGO", "MB51", "TRU-1", "B"],
      ["G002", "11", "Llega una caja dañada desde el CEDIS. ¿Qué haces?", "La recibes y lo comentas en la próxima visita", "La reportas el mismo día con fotos a la bodega que la despachó", "La devuelves al transportista sin avisar", "B"],
      ["G002", "12", "Hiciste por error una salida de 2 unidades. ¿Cómo se corrige?", "Haces una entrada de 2 y luego la salida correcta", "Pides que lo borren del sistema", "Lo dejas así y lo explicas en el muestreo", "A"]];
    T['Lecturas de guías'] = [['Fecha', 'Hora', 'Guía', 'Tienda', 'Persona', 'Cargo', 'Resultado']];
    lecturas('Lecturas de guías', 'G001', sumar(hoy, -3), 0.45);
    var mes = hoy.slice(0, 7);
    T['Actividades'] = [['ID', 'Actividad', 'Cómo', 'Día límite', 'Tiendas', 'Desde', 'Activo'], ['CC', 'Reporte de caja chica de {mes}', 'Sobre a la administración con los recibos y facturas originales. Solo facturas de {mes}.', '5', 'Todas', mes, 'Sí']];
    T['Actividades entregadas'] = [['Fecha', 'Hora', 'Actividad', 'Periodo', 'Tienda', 'Persona', 'Cargo', 'Foto']];
    TIENDAS.slice(0, 6).forEach(function (t) { var g = equipo[t[0]][0]; T['Actividades entregadas'].push([mes + '-0' + ent(1, 6), '17:30', 'CC', mes, t[0], g[0], g[1], '']); });

    /* ventas, presupuesto, flash, garantías (hoja privada) */
    T['Ventas'] = [['Mes', 'Tienda', 'Venta', 'Facturas', 'Ítems', 'Días con venta', 'Último día']];
    T['Presupuesto'] = [['Mes', 'Tienda', 'Venta', 'Facturas', 'Ticket promedio', 'Artículos por factura']];
    T['Curva'] = [['Tienda', 'Mes base'].concat(Array.apply(null, Array(30)).map(function (_, i) { return String(i + 1); }))];
    T['Flash'] = [['Orden', 'Local', 'Tipo', 'Venta día', 'Venta mes', 'Presupuesto', 'Fecha', 'Consulta', 'ERP actualizado']];
    var mesV = ayer.slice(0, 7), dia = Number(ayer.slice(8, 10)), y = +mesV.slice(0, 4), m = +mesV.slice(5, 7), dm = new Date(y, m, 0).getDate();
    var mAnt = isoDe(new Date(y, m - 2, 1)).slice(0, 7);
    TIENDAS.forEach(function (t, i) {
      var pres = t[3], fx = 0.82 + R() * 0.32, venta = r2(pres * dia / dm * fx), tk = 27 + R() * 12, fac = Math.round(venta / tk), art = 1.45 + R() * 0.5;
      T['Ventas'].push([mesV, t[0], venta.toFixed(2), String(fac), String(Math.round(fac * art)), String(dia), ayer]);
      var vAnt = r2(pres * (0.85 + R() * 0.3)), fAnt = Math.round(vAnt / tk);
      T['Ventas'].push([mAnt, t[0], vAnt.toFixed(2), String(fAnt), String(Math.round(fAnt * art)), String(new Date(y, m - 1, 0).getDate()), isoDe(new Date(y, m - 1, 0))]);
      T['Presupuesto'].push([mesV, t[0], String(pres), String(Math.round(pres / 35)), '35', '1.8'], [mAnt, t[0], String(pres), String(Math.round(pres / 35)), '35', '1.8']);
      T['Flash'].push([String(i + 1), t[0], 'Tienda', r2(venta / dia * (0.6 + R() * 0.9)).toFixed(2), venta.toFixed(2), String(pres), ayer, new Date(Date.now() - 25 * 60000).toISOString(), hm(new Date(Date.now() - 40 * 60000))]);
    });
    T['Flash'].push([String(TIENDAS.length + 1), 'CEDIS B2B', 'CEDIS', '1840.00', r2(dia * 1650).toFixed(2), '', ayer, new Date(Date.now() - 25 * 60000).toISOString(), '']);
    T['Garantías'] = [['Desde', 'Hasta', 'Orden', 'Tienda', 'Asesor', 'Cantidad', 'Importe USD']];
    TIENDAS.forEach(function (t, i) { equipo[t[0]].slice(1).forEach(function (g) { var q = ent(0, 6); if (q) T['Garantías'].push([lun, hoy, String(i + 1), t[0], g[0], String(q), r2(q * (6 + R() * 8)).toFixed(2)]); }); });

    /* clientes: ventas futuras y reclamos (todo inventado) */
    T['Ventas futuras'] = [['ID', 'Fecha', 'Hora', 'Tienda', 'Asesor', 'Código', 'Producto', 'Cantidad', 'Cliente', 'Celular', 'Correo', 'Contacto', 'Observaciones', 'Acepta contacto', 'Estado', 'Llegó', 'Aviso enviado', 'Avisado', 'Avisó', 'Cierre', 'Nota de cierre', 'En CEDIS']];
    var nVF = 0, ESTVF = ['Esperando', 'Esperando', 'Esperando', 'Llegó', 'Avisado', 'Compró', 'No compró'];
    TIENDAS.forEach(function (t) {
      for (var k = 0; k < ent(1, 4); k++) {
        nVF++; var p = de(PRODUCTOS), e = de(ESTVF), f = sumar(hoy, -ent(1, 40)), as = de(equipo[t[0]])[0];
        T['Ventas futuras'].push(['VF' + String(100 + nVF), f, pad(ent(10, 20)) + ':' + pad(ent(0, 59)), t[0], as, p[0], p[1], String(ent(1, 2)), 'Cliente de ejemplo ' + nVF, '0990000' + String(100 + nVF), '',
          de(['WhatsApp', 'Llamada']), 'Pedido de ejemplo para la demostración.', 'Sí', e, e !== 'Esperando' ? sumar(f, 5) : '', '', /Avisado|Compró|No compró/.test(e) ? sumar(f, 6) : '', /Avisado|Compró|No compró/.test(e) ? as : '',
          /Compró|No compró/.test(e) ? sumar(f, 8) : '', e === 'No compró' ? 'Compró otro modelo' : '', R() < 0.4 ? 'Sí' : '']);
      }
    });
    T['Reclamos clientes'] = [['ID', 'Fecha', 'Tienda', 'Tipo', 'Origen', 'Producto', 'Cliente', 'Novedad', 'Acción tomada', 'Estado', 'Fecha cierre'],
      ['R001', sumar(hoy, -6), 'Urdesa', 'Garantía', 'Tienda', 'Bocina Bluetooth portátil 10 W', 'Cliente de ejemplo A', 'La bocina no carga después de 2 semanas.', 'Se recibió para garantía con el proveedor.', 'Abierto', ''],
      ['R002', sumar(hoy, -12), 'Scala', 'Servicio', 'Redes sociales', 'Cámara de seguridad Wi-Fi 2 MP', 'Cliente de ejemplo B', 'Demora en la atención un sábado.', 'Se habló con el equipo y se ajustó el horario.', 'Cerrado', sumar(hoy, -9)],
      ['R003', sumar(hoy, -2), 'Condado', 'Cambio', 'Tienda', 'Audífonos TWS con estuche de carga', 'Cliente de ejemplo C', 'Pide cambio por otro color.', '', 'Abierto', '']];

    /* registro de uso y correos */
    T['Registro'] = [['Fecha', 'Hora', 'Panel', 'Quién', 'Evento', 'Detalle', 'Segundos', 'Sesión', 'Dispositivo']];
    for (var d = 6; d >= 0; d--) {
      SUPERVISORES.slice(0, 3).forEach(function (s, i) { if (R() < 0.8) T['Registro'].push([sumar(hoy, -d), pad(ent(8, 18)) + ':' + pad(ent(0, 59)), 'Panel', s[0], 'Sesión', 'Pendientes, Inventario', String(ent(300, 2400)), 'x' + d + i, de(['Teléfono', 'Computadora'])]); });
      TIENDAS.forEach(function (t, i) { if (R() < 0.7) T['Registro'].push([sumar(hoy, -d), pad(ent(9, 20)) + ':' + pad(ent(0, 59)), 'Tienda', t[0], 'Sesión', 'Hoy, Pendientes', String(ent(120, 1500)), 't' + d + i, 'Teléfono']); });
    }
    T['Correos'] = [['Fecha', 'Hora', 'Modo', 'Asunto', 'Para', 'Copia']];
    TIENDAS.forEach(function (t, i) { T['Correos'].push([sumar(hoy, -1), '07:0' + (i % 10), 'Prueba', 'Pendientes de ' + t[0] + ' (ejemplo)', 'tienda' + (i + 1) + '@ejemplo.test', '']); });

    /* inventario: Muestreo Top 50 */
    T['MueEstado'] = [['Semana', 'Tienda', 'Fase', 'Actualizado', 'Por']];
    T['MueLista'] = [['Semana', 'Tienda', 'N', 'Código', 'Descripción', 'Grupo', 'Motivo', 'Barras', 'Teórico', 'Costo', 'Precio', 'Conteo 1', 'Conteo 2', 'Diferencia', 'Diferencia $', 'Causa', 'Explicación', 'Estado', 'Publicada']];
    T['MueConteo'] = [['Clave', 'Semana', 'Tienda', 'Ronda', 'Persona', 'Código', 'Método', 'Cantidad', 'Fecha']];
    T['MueLecturas'] = [['Fecha', 'Semana', 'Tienda', 'Ronda', 'Persona', 'Leído', 'Código', 'Método', 'Cantidad', 'Resultado']];
    T['MueCorrecciones'] = [['Fecha', 'Semana', 'Tienda', 'Código', 'Descripción', 'Sistema', 'Contado tienda', 'Recuento', 'Diferencia final', 'Diferencia $', 'Decisión', 'Comentario', 'Por']];
    T['Informes de inventario'] = [['ID', 'Fecha', 'Hora', 'Semana', 'Tienda', 'Tipo', 'Elaboró', 'Líder', 'Personal', 'Faltante PVP', 'Sobrante PVP', 'A descontar', 'Reparto', 'Estado', 'Observaciones', 'Datos']];
    var sAct = semISO(hoy), luAct = lunes(hoy), sAnt = semISO(sumar(luAct, -7)), luAnt = sumar(luAct, -7);
    var FASES = ['Enviado', 'Enviado', 'Enviado', 'Contando', 'Enviado', 'Segundo conteo', 'Por contar', 'Por enviar', 'Contando', 'Por contar'];
    var CAUSAS = ['Vendido antes del conteo', 'Error de conteo', 'Transferencia sin recibir', 'Producto en exhibición'];
    function mue(sem, lu, t, ti, fase, vivo) {
      var g = equipo[t[0]], lista = PRODUCTOS.slice().sort(function () { return R() - 0.5; }).slice(0, 50);
      T['MueEstado'].push([sem, t[0], fase, (fase === 'Por contar' ? lu + ' 07:00' : sumar(lu, ent(0, 2)) + ' ' + pad(ent(9, 18)) + ':' + pad(ent(0, 59))), fase === 'Por contar' ? '' : g[0][0]]);
      var contados = fase === 'Contando' ? ent(18, 38) : fase === 'Por contar' ? 0 : 50;
      lista.forEach(function (p, j) {
        var teo = ent(1, 14), c1 = '', c2 = '', dif = '', difd = '', causa = '', exp = '', est = 'Pendiente';
        if (j < contados) {
          var malo = R() < (t[2] ? 0.05 : 0.08);
          c1 = String(malo ? Math.max(0, teo + de([-2, -1, -1, 1])) : teo);
          if (fase === 'Contando') est = 'Contado';
          else if (malo && fase === 'Segundo conteo') est = 'Segundo conteo';
          else {
            if (malo && R() < 0.4) c2 = String(teo);
            var c = Number(c2 || c1), df = c - teo;
            est = df === 0 ? 'OK' : 'Diferencia'; dif = String(df); difd = r2(df * p[3]).toFixed(2);
            if (df) { causa = de(CAUSAS); exp = 'Explicación de ejemplo de la tienda.'; }
          }
        }
        T['MueLista'].push([sem, t[0], String(j + 1), p[0], p[1], p[2], de(['Más vendido $', 'Más vendido unidades', 'Alto valor', 'Al azar']), '7500000' + String(10000 + PRODUCTOS.indexOf(p)), String(teo), p[3].toFixed(2), p[4].toFixed(2), c1, c2, dif, difd, causa, exp, est, lu]);
        if (c1 !== '') {
          var quien = g[j % g.length][0], met = de(['Cámara', 'Cámara', 'Escáner', 'Manual']);
          var f = vivo ? haceMin((contados - j) * 2) : sumar(lu, 1) + ' ' + pad(10 + Math.floor(j / 12)) + ':' + pad((j * 7) % 60);
          T['MueConteo'].push([sem + '|' + t[0] + '|1|' + p[0], sem, t[0], '1', quien, p[0], met, c1, f]);
          if (vivo) T['MueLecturas'].push([f, sem, t[0], '1', quien, '7500000' + String(10000 + PRODUCTOS.indexOf(p)), p[0], met, c1, 'OK']);
        }
      });
      // cíclico: 10 productos más en las tiendas que ya enviaron
      if (fase === 'Enviado' && ti % 2 === 0) PRODUCTOS.slice(50, 60).forEach(function (p, j) {
        var teo = ent(1, 8), c = R() < 0.1 ? teo - 1 : teo, df = c - teo;
        T['MueLista'].push([sem, t[0], String(51 + j), p[0], p[1], p[2], 'Cíclico', '7500000' + String(10000 + PRODUCTOS.indexOf(p)), String(teo), p[3].toFixed(2), p[4].toFixed(2), String(c), '', String(df), r2(df * p[3]).toFixed(2), df ? 'Error de conteo' : '', df ? 'Explicación de ejemplo.' : '', df ? 'Diferencia' : 'OK', lu]);
      });
    }
    TIENDAS.forEach(function (t, ti) { mue(sAnt, luAnt, t, ti, 'Enviado', false); });
    TIENDAS.forEach(function (t, ti) { mue(sAct, luAct, t, ti, FASES[ti], ti === 3); });
    // una revisión ya hecha por la administración y un informe de ejemplo de la semana pasada
    var difAnt = T['MueLista'].filter(function (r) { return r[0] === sAnt && r[17] === 'Diferencia'; }).slice(0, 4);
    difAnt.forEach(function (r) { T['MueCorrecciones'].push([sumar(luAct, -2), sAnt, r[1], r[3], r[4], r[8], r[11], r[8], '0', '0.00', 'Cuadra, fue error de conteo', 'Revisión de ejemplo.', ADMIN]); });
    T['Informes de inventario'].push(['INV-001', sumar(luAct, -2), '16:00', sAnt, 'Urdesa', 'Muestreo Top 50', ADMIN, equipo['Urdesa'][0][0], equipo['Urdesa'].map(function (x) { return x[0]; }).join(', '), '18.50', '0.00', '18.50', 'Partes iguales', 'Firmado', 'Informe de ejemplo.', '']);

    return {v: VERSION, dia: hoy, vivo: Date.now(), tabs: T};
  }

  /* ---------- guardar / leer ---------- */
  var SITIO = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
  var GUIA_VF = SITIO.replace(/prueba\/$/, '') + 'guias/ventas-futuras.html';
  var GUIA_MPT = SITIO.replace(/prueba\/$/, '') + 'guias/manual-procesos-tienda.html';
  var HOJA_PDF = 'https://github.com/diegorevelom/politicas-tefes/raw/main/supervision/Hoja%20de%20supervision%20de%20tienda.pdf';
  var FOTO = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#dfe7f0"/><text x="160" y="126" font-family="Arial" font-size="18" text-anchor="middle" fill="#4a5866">Foto de ejemplo</text></svg>');
  var DB = null;
  /* Datos reales: foto cifrada (foto.enc) que abre la portada con la clave del enlace (#k=...).
     La portada la descifra y la deja aquí con ponerFoto(); las demás pantallas solo la leen. */
  var KEY_K = 'tefesPrueba.k';
  function claveReal() { try { return localStorage.getItem(KEY_K) || ''; } catch (e) { return ''; } }
  var EN_PORTADA = /\/(index\.html)?$/.test(location.pathname);
  function cargar() {
    var real = claveReal();
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && (real ? s.real : !s.real && s.v === VERSION && s.dia === hoyISO())) DB = s;
    } catch (e) {}
    if (!DB && real && !EN_PORTADA) {   // falta la copia de trabajo: la portada la vuelve a armar y regresa aquí
      document.documentElement.style.display = 'none';
      location.replace(SITIO + '?rehacer=' + encodeURIComponent(location.pathname.split('/').pop() + location.search));
      throw new Error('Cargando la foto de datos reales…');
    }
    if (!DB) DB = generar();
    if (!DB.real) refrescarVivo();
    guardar();
  }
  function ponerFoto(foto) {
    var ej = generar().tabs, T = foto.tabs;
    Object.keys(ej).forEach(function (t) { if (!T[t]) T[t] = t === 'Claves' ? ej[t] : [ej[t][0]]; });
    DB = {v: VERSION, real: true, fecha: foto.fecha, dia: hoyISO(), tabs: T};
    guardar();
  }
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} }
  // la tienda que cuenta "en vivo" se mantiene viva mientras dure la demostración
  function refrescarVivo() {
    var T = DB.tabs, lec = T['MueLecturas'], con = T['MueConteo'];
    if (lec.length < 2) return;
    var ult = lec.slice(1).map(function (r) { return r[0]; }).sort().pop(), d = new Date(ult.replace(' ', 'T') + ':00'), corr = Math.floor((Date.now() - d.getTime()) / 60000) - 1;
    if (corr <= 3) return;
    function mover(f) { var x = new Date(f.replace(' ', 'T') + ':00'); x = new Date(x.getTime() + corr * 60000); return isoDe(x) + ' ' + hm(x); }
    var vivos = {};
    lec.slice(1).forEach(function (r) { vivos[r[2] + '|' + r[6]] = 1; r[0] = mover(r[0]); });
    con.slice(1).forEach(function (r) { if (vivos[r[2] + '|' + r[5]]) r[8] = mover(r[8]); });
  }
  function hoja(nombre) { var t = DB.tabs[nombre]; if (!t) throw new Error('No existe la pestaña ' + nombre + ' en el entorno de pruebas.'); return t; }
  function colN(s) { var n = 0; for (var i = 0; i < s.length; i++) n = n * 26 + s.charCodeAt(i) - 64; return n - 1; }
  function rango(a1) {
    var m = String(a1).match(/^(?:'((?:[^']|'')+)'|([^!]+))(?:!([A-Z]*)(\d*)(?:(:)([A-Z]*)(\d*))?)?$/);
    if (!m) throw new Error('Rango no válido: ' + a1);
    var r = {hoja: (m[1] || m[2]).replace(/''/g, "'"), c0: m[3] ? colN(m[3]) : 0, f0: m[4] ? +m[4] - 1 : 0, c1: null, f1: null};
    if (m[5]) { r.c1 = m[6] ? colN(m[6]) : null; r.f1 = m[7] ? +m[7] - 1 : null; }
    else if (m[3] && m[4]) { r.c1 = r.c0; r.f1 = r.f0; }   // una sola celda
    return r;
  }
  function leer(a1) {
    var r = rango(a1), t = hoja(r.hoja), out = [];
    var f1 = r.f1 == null ? t.length - 1 : Math.min(r.f1, t.length - 1);
    for (var i = r.f0; i <= f1; i++) {
      var fila = t[i] || [], c1 = r.c1 == null ? Math.max(fila.length - 1, r.c0) : r.c1, o = [];
      for (var j = r.c0; j <= c1; j++) o.push(txt(fila[j]));
      while (o.length && o[o.length - 1] === '') o.pop();
      out.push(o);
    }
    while (out.length && !out[out.length - 1].length) out.pop();
    return out;
  }
  function escribir(a1, valores) {
    var r = rango(a1), t = DB.tabs[r.hoja] || (DB.tabs[r.hoja] = []);
    (valores || []).forEach(function (fila, i) {
      var f = t[r.f0 + i] || (t[r.f0 + i] = []);
      fila.forEach(function (v, j) { while (f.length < r.c0 + j) f.push(''); f[r.c0 + j] = txt(v); });
    });
    for (var i = 0; i < t.length; i++) if (!t[i]) t[i] = [];
    guardar();
    return {updatedRange: a1, updatedRows: (valores || []).length};
  }
  function agregar(nombre, fila) { hoja(nombre).push(fila.map(txt)); guardar(); return hoja(nombre).length; }
  function filas(nombre) { return hoja(nombre).slice(1); }
  function limpiar() { try { localStorage.removeItem(KEY); Object.keys(localStorage).forEach(function (k) { if (/^(tiendaDatos_|panelDatos_|supTefes|vfCat_|mueDemo|supSTEREN|supIntro_|supDraft|tabSup|invOrdSup)/.test(k)) localStorage.removeItem(k); }); } catch (e) {} DB = null; }
  // con datos reales vuelve a la foto original pasando por la portada (devuelve 'va' porque navega)
  function reiniciar() {
    limpiar();
    if (claveReal()) { location.replace(SITIO + '?rehacer=' + encodeURIComponent(location.pathname.split('/').pop() + location.search)); return 'va'; }
    cargar();
  }
  function salirReal() { try { localStorage.removeItem(KEY_K); } catch (e) {} limpiar(); }

  cargar();
  window.TEFES_PRUEBA = {ponerFoto: ponerFoto, claveReal: claveReal, salirReal: salirReal, esReal: function () { return !!DB.real; }, fecha: function () { return DB.fecha || ''; },
    leer: leer, escribir: escribir, agregar: agregar, filas: filas, hoja: hoja, guardar: guardar, reiniciar: reiniciar,
    hoyISO: hoyISO, sumar: sumar, semISO: semISO, lunes: lunes, hm: hm, isoDe: isoDe, SITIO: SITIO, FOTO: FOTO, ADMIN: ADMIN,
    token: function (tienda) { var c = filas('Claves').filter(function (r) { return r[0] === tienda; })[0]; return c ? c[1] : ''; },
    tiendaDeToken: function (tok) { var c = filas('Claves').filter(function (r) { return r[1] === tok && !/^__/.test(r[0]); })[0]; return c ? c[0] : ''; },
    tiendas: function () { return filas('Tiendas').map(function (r) { return r[0]; }); }};
})();
