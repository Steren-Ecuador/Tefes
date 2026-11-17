/**
 * fpg1 (Diego 16-nov-2026): registro de formas de pago de las facturas del POS Steren.
 * Asesores (asesor.html) y gerentes de tienda (tienda.html) registran: factura, forma de pago, n.º de pedido o comprobante (p. ej. los billetes
 * de Shopping Dólares), valor pagado con esa forma (con IVA) y, opcional, cliente, total de la factura y foto
 * (modelo: Condado/Shopping Dollars CONDADO/REgistro_transacciones_shopping_dolar y Mall Sol/Mobi Sol).
 * El perfil Financiero (y el administrador) ven todas las tiendas en el panel (Ventas › Formas de pago), filtran, exportan
 * y marcan la entrega al centro comercial con su N° de recibo.
 * fpg5: el ingreso es un asistente de 4 pasos y fpgValidar_ aplica las reglas contables (factura completa, fecha y total,
 *   cuadre de la factura, vales/referencias que no se repiten, foto obligatoria de vales y transferencias).
 * fpg2: formas deUna, Transferencias, Shopping Dólares - Condado (solo Condado), MobiSol - Mall del Sol (solo Mall del Sol) y Otra (con detalle obligatorio, col T).
 * Datos: pestaña 'Formas de pago' de la Base (se crea sola). Una fila por factura y forma; la misma factura + forma dos veces se rechaza.
 *
 * TRAZABILIDAD (Diego: "es información contable"): nada se borra. Un error se ANULA con motivo (la fila queda, marcada Anulada).
 * Cada movimiento (registro, anulación, entrega, consulta del panel, exportación) queda en la pestaña 'Formas de pago bitácora',
 * que la app solo agrega, nunca edita. Cada línea lleva una huella SHA-256 encadenada con la anterior: si alguien edita o borra
 * a mano una línea de la bitácora, o cambia a mano una fila de datos, el panel lo avisa.
 */
const FPG = {
  HOJA: 'Formas de pago',
  BIT: 'Formas de pago bitácora',
  CAB: ['ID', 'Fecha registro', 'Hora', 'Tienda', 'Registró', 'Desde', 'N° factura', 'Forma de pago', 'N° de pedido', 'Valor con IVA',
    'Cliente', 'Valor de la factura', 'Foto', 'Entregado', 'N° recibo', 'Marcó entrega', 'Estado', 'Anuló', 'Motivo anulación', 'Detalle otra', 'Banco', 'Fecha factura'],
  BIT_CAB: ['Fecha', 'Hora', 'Acción', 'ID', 'Tienda', 'Quién', 'Desde', 'Detalle', 'Huella fila', 'Huella'],
  // fpg2 (Diego 16-nov): lista definitiva. Shopping Dólares solo Condado y MobiSol solo Mall del Sol; 'Otra' exige detalle.
  // fpg4: + Tipti (pedido de 7 dígitos) y banco en transferencias, según el formato de Financiero (Yadira Román)
  FORMAS: ['deUna', 'Transferencias', 'Tipti', 'Shopping Dólares - Condado', 'MobiSol - Mall del Sol', 'Otra'],
  SOLO: {'Shopping Dólares - Condado': /condado/i, 'MobiSol - Mall del Sol': /\bsol\b/i},
  DIAS_TIENDA: 60,
  CLAVE_MENU: 'ventas/formaspago'
};

function fpgHoja_() {
  const ss = ss_();
  let sh = ss.getSheetByName(FPG.HOJA);
  if (!sh) { sh = ss.insertSheet(FPG.HOJA); sh.appendRow(FPG.CAB); sh.setFrozenRows(1); }
  else if (sh.getLastColumn() < FPG.CAB.length) sh.getRange(1, 1, 1, FPG.CAB.length).setValues([FPG.CAB]);
  return sh;
}

function fpgFilas_() {
  const sh = ss_().getSheetByName(FPG.HOJA);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, FPG.CAB.length).getDisplayValues().filter(r => r[0]);
}

function fpgNum_(x) {
  let s = String(x == null ? '' : x).replace(/[$\s]/g, '');
  if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s); return isNaN(n) ? 0 : n;
}

function fpgIso_(x) {
  const s = String(x || '').trim(); let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); if (m) return m[0];
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s); return m ? m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2) : '';
}

function fpgObj_(r) {
  return {id: r[0], fecha: fpgIso_(r[1]), hora: r[2], tienda: r[3], registro: r[4], registroVer: nombreCorto_(r[4]) || r[4], desde: r[5],
    factura: String(r[6] || '').replace(/^'/, ''), forma: r[7], pedido: String(r[8] || '').replace(/^'/, ''), valor: fpgNum_(r[9]),
    cliente: r[10] || '', valorFac: fpgNum_(r[11]), foto: r[12] || '', entregado: fpgIso_(r[13]), recibo: String(r[14] || '').replace(/^'/, ''), marco: r[15] || '',
    estado: r[16] || 'Vigente', anulo: r[17] || '', motivoAnula: r[18] || '', otra: r[19] || '', banco: r[20] || '', fechaFac: fpgIso_(String(r[21] || '').replace(/^'/, ''))};
}
/** Formas que puede usar una tienda (las de centro comercial solo en su tienda) */
function fpgFormasDe_(tienda) { return FPG.FORMAS.filter(f => !FPG.SOLO[f] || FPG.SOLO[f].test(tienda)); }

/* ---------- bitácora ---------- */
function fpgSha_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)
    .map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
}
/** Huella del contenido de una fila de datos (lo que importa contablemente) */
function fpgHuellaFila_(o) {
  return fpgSha_([o.id, o.tienda, o.registro, o.factura, o.forma, o.pedido, Number(o.valor || 0).toFixed(2), o.cliente, Number(o.valorFac || 0).toFixed(2),
    o.foto, o.entregado, o.recibo, o.estado, o.motivoAnula].concat(o.otra || o.banco ? [o.otra] : []).concat(o.banco || o.fechaFac ? [o.banco] : []).concat(o.fechaFac ? [o.fechaFac] : []).join('|')).slice(0, 16);
}
function fpgBitHoja_() {
  const ss = ss_();
  let sh = ss.getSheetByName(FPG.BIT);
  if (!sh) { sh = ss.insertSheet(FPG.BIT); sh.appendRow(FPG.BIT_CAB); sh.setFrozenRows(1); }
  return sh;
}
/** Agrega una línea (llamar con el candado tomado). o = fila después del cambio (o null para consultas). */
function fpgLog_(accion, o, quien, desde, detalle) {
  try {
    const sh = fpgBitHoja_(), n = sh.getLastRow();
    const prev = n > 1 ? String(sh.getRange(n, 10).getDisplayValue()) : '';
    const now = new Date(), f = Utilities.formatDate(now, TZ, 'yyyy-MM-dd'), h = Utilities.formatDate(now, TZ, 'HH:mm:ss');
    const hf = o ? fpgHuellaFila_(o) : '';
    const linea = ["'" + f, "'" + h, accion, o ? o.id : '', o ? o.tienda : '', String(quien || '').split('#')[0], desde || '', String(detalle || '').replace(/^[=+\-@]/, ' ').slice(0, 2000), "'" + hf];
    linea.push("'" + fpgSha_(prev + '|' + linea.map(x => String(x).replace(/^'/, '')).join('|')).slice(0, 24));   // con ' para que la hoja no las vuelva número
    sh.appendRow(linea);
  } catch (e) { console.error('fpg bitácora: ' + e.message); }
}
/** Revisa la cadena de la bitácora y compara cada fila de datos con su última huella. */
function fpgIntegridad_(filas) {
  const sh = ss_().getSheetByName(FPG.BIT);
  if (!sh || sh.getLastRow() < 2) return {ok: !filas.length, lineas: 0, rotas: [], cambiadas: filas.map(o => o.id).slice(0, 50)};
  const B = sh.getRange(2, 1, sh.getLastRow() - 1, FPG.BIT_CAB.length).getDisplayValues();
  let prev = ''; const rotas = [], ultima = {};
  B.forEach((r, i) => {
    const esp = fpgSha_(prev + '|' + r.slice(0, 9).map(x => String(x).replace(/^'/, '')).join('|')).slice(0, 24);
    if (esp !== r[9]) rotas.push(i + 2);
    prev = r[9];
    if (r[3] && r[8]) ultima[r[3]] = r[8];
  });
  const cambiadas = filas.filter(o => !ultima[o.id] || ultima[o.id] !== fpgHuellaFila_(o)).map(o => o.id);
  return {ok: !rotas.length && !cambiadas.length, lineas: B.length, rotas: rotas.slice(0, 20), cambiadas: cambiadas.slice(0, 50)};
}
function fpgDetalle_(o) {
  return 'Fact. ' + o.factura + (o.fechaFac ? ' del ' + o.fechaFac : '') + ' · ' + o.forma + (o.otra ? ' (' + o.otra + ')' : '') + (o.banco ? ' · banco ' + o.banco : '') + ' · $' + Number(o.valor || 0).toFixed(2) + ' · pedido/comprobante ' + String(o.pedido).slice(0, 300) +
    (o.cliente ? ' · cliente ' + o.cliente : '') + (o.valorFac ? ' · total fact. $' + Number(o.valorFac).toFixed(2) : '') + (o.foto ? ' · con foto' : '');
}

/* ---------- tienda y asesor ---------- */
/** Los registros de su tienda de los últimos 60 días, el más nuevo primero (el asesor filtra los suyos en pantalla) */
function apiFPGLista(token) {
  const tienda = exigirTienda_(token).nombre, lim = sumarDiasIso_(hoy_(), -FPG.DIAS_TIENDA);
  const lista = fpgFilas_().map(fpgObj_).filter(x => x.tienda === tienda && x.fecha >= lim).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  const pre = lista.map(x => String(x.factura).slice(0, 7)).filter(x => /^\d{3}-\d{3}$/.test(x));   // fpg5: punto de emisión que más usa la tienda
  return {formas: fpgFormasDe_(tienda), hoy: hoy_(), prefijo: pre.sort((a, b) => pre.filter(y => y === b).length - pre.filter(y => y === a).length)[0] || '', lista: lista};
}

/* fpg5: VALIDACIÓN CONTABLE de un registro (Diego 16-nov: "piénsalo como un contador"). Función pura: la usa el servidor y, copiada tal cual,
   el entorno de pruebas. d = lo que manda el asistente; filas = registros existentes (objetos); hoy = 'yyyy-MM-dd'; formas = las de la tienda.
   Devuelve los datos normalizados o lanza un Error con un mensaje claro para el usuario. */
function fpgValidar_(d, tienda, filas, hoy, formas) {
  d = d || {};
  const txt = (v, n) => String(v == null ? '' : v).trim().replace(/^[=+\-@]+/, '').replace(/\s+/g, ' ').slice(0, n || 200);
  const num = x => { let s = String(x == null ? '' : x).replace(/[$\s]/g, ''); if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.'); const n = Number(s); return isNaN(n) ? 0 : Math.round(n * 100) / 100; };
  const usd = n => '$' + Number(n || 0).toFixed(2).replace('.', ',');
  const dias = (iso, k) => { const t = new Date(iso + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + k); return t.toISOString().slice(0, 10); };
  const VALES = {'Shopping Dólares - Condado': 1, 'MobiSol - Mall del Sol': 1};
  const FOTO = {'Shopping Dólares - Condado': 1, 'MobiSol - Mall del Sol': 1, 'Transferencias': 1};
  /* 1. factura completa del SRI: establecimiento-punto-secuencial (005-001-000004800) */
  const g = String(d.factura == null ? '' : d.factura).replace(/[^\d-]/g, ' ').trim().split(/[\s-]+/).filter(Boolean);
  let fac = '';
  if (g.length === 3 && g[0].length <= 3 && g[1].length <= 3 && g[2].length <= 9 && Number(g[2]) > 0) fac = ('00' + g[0]).slice(-3) + '-' + ('00' + g[1]).slice(-3) + '-' + ('00000000' + g[2]).slice(-9);
  else if (g.length === 1 && g[0].length === 15) fac = g[0].slice(0, 3) + '-' + g[0].slice(3, 6) + '-' + g[0].slice(6);
  if (!fac || /^000-|-000-/.test(fac)) throw new Error('Escribe la factura completa, como sale en el POS: 005-001-000004800.');
  /* 2. fecha y total de la factura */
  const fechaFac = /^\d{4}-\d{2}-\d{2}$/.test(String(d.fechaFac || '')) ? String(d.fechaFac) : '';
  if (!fechaFac) throw new Error('Pon la fecha de la factura.');
  if (fechaFac > hoy) throw new Error('La fecha de la factura no puede ser futura.');
  if (fechaFac < dias(hoy, -45)) throw new Error('La factura tiene más de 45 días. Pide a Financiero que la registre.');
  const valorFac = num(d.valorFac);
  if (!(valorFac > 0)) throw new Error('Pon el total de la factura con IVA.');
  if (valorFac > 100000) throw new Error('Revisa el total de la factura: parece demasiado alto.');
  /* 3. forma de pago y sus datos */
  const forma = txt(d.forma, 40);
  if ((formas || []).indexOf(forma) < 0) throw new Error('Elige una forma de pago de la lista.');
  const otra = forma === 'Otra' ? txt(d.otra, 100) : '', banco = forma === 'Transferencias' ? txt(d.banco, 40) : '';
  let ref = txt(d.pedido, 1500), claves = [];
  if (forma === 'Otra' && otra.length < 3) throw new Error('Escribe cuál es la otra forma de pago.');
  if (forma === 'Transferencias' && banco.length < 3) throw new Error('Elige el banco de la transferencia.');
  if (forma === 'Tipti') { ref = ref.replace(/\D/g, ''); if (ref.length !== 7) throw new Error('El pedido Tipti tiene 7 dígitos.'); claves = ['TIPTI ' + ref]; }
  else if (forma === 'deUna') { ref = ref.replace(/\s/g, ''); if (ref.length < 4) throw new Error('Escribe la referencia de deUna.'); claves = ['DEUNA ' + ref.toUpperCase()]; }
  else if (forma === 'Transferencias') { ref = ref.replace(/\s/g, ''); if (ref.length < 3) throw new Error('Escribe el número de documento de la transferencia.'); claves = ['TRANSF ' + banco.toUpperCase() + ' ' + ref.toUpperCase()]; }
  else if (VALES[forma]) {
    const c = (ref.match(/\d{4,}/g) || []).map(x => String(Number(x)));
    if (!c.length) throw new Error('Escribe los números de los vales.');
    const rep = c.filter((x, i) => c.indexOf(x) !== i); if (rep.length) throw new Error('El vale ' + rep[0] + ' está repetido en la lista.');
    claves = c.map(x => 'VALE ' + forma + ' ' + x);
    ref = forma.indexOf('Shopping') === 0 ? c.map(x => 'BILLECOND' + x).join(' ') : c.join(' ');
  } else { if (ref.length < 3) throw new Error('Escribe el número de comprobante.'); claves = []; }
  /* 4. valor pagado con esta forma */
  let valor = num(d.valor);
  if (forma === 'Shopping Dólares - Condado') { const n = claves.length; if (valor && Math.abs(valor - n) > 0.004) throw new Error((n === 1 ? 'Es 1 vale de $1' : 'Son ' + n + ' vales de $1') + ': el valor pagado debe ser ' + usd(n) + '.'); valor = n; }
  if (!(valor > 0)) throw new Error('Pon el valor pagado con esta forma.');
  if (valor > valorFac + (VALES[forma] ? 0.99 : 0) + 0.004) throw new Error('Lo pagado con esta forma (' + usd(valor) + ') es más que el total de la factura (' + usd(valorFac) + ').');
  /* 5. respaldo */
  const foto = /^https:\/\/drive\.google\.com\//.test(String(d.foto || '')) ? String(d.foto) : '';
  if (FOTO[forma] && !foto) throw new Error('Toma la foto del ' + (forma === 'Transferencias' ? 'comprobante de la transferencia' : 'vale y la factura') + '.');
  /* 6. cuadre con lo ya registrado de la misma factura (vigentes) */
  const vig = (filas || []).filter(x => (x.estado || 'Vigente') !== 'Anulada');
  const misma = vig.filter(x => x.tienda === tienda && String(x.factura).replace(/\D/g, '') === fac.replace(/\D/g, ''));
  misma.forEach(x => {
    if (x.valorFac && Math.abs(x.valorFac - valorFac) > 0.004) throw new Error('Esta factura ya está registrada con total ' + usd(x.valorFac) + '. Revisa el total o anula el registro anterior.');
    if (x.fechaFac && x.fechaFac !== fechaFac) throw new Error('Esta factura ya está registrada con fecha ' + x.fechaFac.split('-').reverse().join('/') + '. Revisa la fecha.');
  });
  const suma = misma.reduce((a, x) => a + (Number(x.valor) || 0), 0);
  const tol = VALES[forma] || misma.some(x => VALES[x.forma]) ? 0.994 : 0.004;   // los vales de $1 pueden pasar la factura por centavos
  if (suma + valor > valorFac + tol) throw new Error('Con este pago, las formas registradas de la factura suman ' + usd(suma + valor) + ' y la factura es de ' + usd(valorFac) + '.');
  /* 7. una referencia, pedido o vale no se usa dos veces (en ninguna factura ni tienda) */
  if (claves.length) {
    const ya = {};
    vig.forEach(x => {
      const f = x.forma, r = String(x.pedido || '');
      let k = [];
      if (f === 'Tipti') k = ['TIPTI ' + r.replace(/\D/g, '')];
      else if (f === 'deUna') k = ['DEUNA ' + r.replace(/\s/g, '').toUpperCase()];
      else if (f === 'Transferencias') k = ['TRANSF ' + String(x.banco || '').toUpperCase() + ' ' + r.replace(/\s/g, '').toUpperCase()];
      else if (VALES[f]) k = (r.match(/\d{4,}/g) || []).map(y => 'VALE ' + f + ' ' + String(Number(y)));
      k.forEach(y => { ya[y] = x; });
    });
    const choque = claves.find(k => ya[k]);
    if (choque) { const x = ya[choque];
      throw new Error((VALES[forma] ? 'El vale ' + choque.split(' ').pop() : forma === 'Tipti' ? 'El pedido Tipti ' + ref : forma === 'deUna' ? 'La referencia deUna ' + ref : 'La transferencia ' + ref + ' de ' + banco) +
        ' ya se registró en la factura ' + x.factura + ' (' + x.tienda + ', ' + String(x.fecha || '').split('-').reverse().join('/') + ').'); }
  }
  return {factura: fac, fechaFac: fechaFac, valorFac: valorFac, forma: forma, otra: otra, banco: banco, pedido: ref, valor: valor, foto: foto, cliente: txt(d.cliente, 100)};
}

function apiFPGRegistrar(token, d) {
  const tienda = exigirTienda_(token).nombre;
  d = d || {};
  const registro = String(d.registro || '').trim().slice(0, 80), desde = d.desde === 'Asesor' ? 'Asesor' : 'Tienda';
  if (!registro) throw new Error('Elige tu nombre.');
  asPersonaValida_(tienda, registro);
  if (d.confirmo !== true) throw new Error('Confirma que revisaste los datos.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = fpgHoja_(), L = fpgFilas_();
    const v = fpgValidar_(d, tienda, L.map(fpgObj_), hoy_(), fpgFormasDe_(tienda));   // fpg5: todas las reglas contables
    const id = 'FP' + ('0000' + (Math.max(0, ...L.map(r => Number(String(r[0]).replace(/\D/g, '')) || 0)) + 1)).slice(-5);
    const fila = [id, hoy_(), Utilities.formatDate(new Date(), TZ, 'HH:mm'), tienda, registro, desde, "'" + v.factura, v.forma, "'" + v.pedido, v.valor,
      v.cliente, v.valorFac, v.foto, '', '', '', 'Vigente', '', '', v.otra, v.banco, "'" + v.fechaFac];
    sh.appendRow(fila);
    const o = fpgObj_(sh.getRange(sh.getLastRow(), 1, 1, FPG.CAB.length).getDisplayValues()[0]);   // tal como quedó en la hoja (para la huella)
    fpgLog_('Registro', o, registro, desde, fpgDetalle_(o));
    return o;
  } finally { lock.releaseLock(); }
}

/** Anular desde la tienda o el asesor: solo registros de su tienda hechos HOY, con motivo. La fila no se borra. */
function apiFPGAnularTienda(token, id, persona, motivo) {
  const tienda = exigirTienda_(token).nombre;
  persona = String(persona || '').trim().slice(0, 80); motivo = String(motivo || '').trim().replace(/^[=+\-@]+/, '').slice(0, 300);
  if (!persona) throw new Error('Elige tu nombre.');
  asPersonaValida_(tienda, persona);
  if (motivo.length < 5) throw new Error('Escribe el motivo de la anulación.');
  return fpgAnular_(id, persona, 'Tienda', motivo, o => {
    if (o.tienda !== tienda) throw new Error('Ese registro no es de tu tienda.');
    if (o.fecha !== hoy_()) throw new Error('Solo se anula el mismo día. Para uno anterior, pide a Financiero que lo anule.');
    if (o.entregado) throw new Error('Ya está marcado como entregado: pide a Financiero que lo revise.');
  });
}

function fpgAnular_(id, quien, desde, motivo, validar) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = fpgHoja_(), n = sh.getLastRow() - 1; if (n < 1) throw new Error('No encontré el registro.');
    const i = sh.getRange(2, 1, n, 1).getDisplayValues().map(r => r[0]).indexOf(String(id));
    if (i < 0) throw new Error('No encontré el registro.');
    const antes = fpgObj_(sh.getRange(i + 2, 1, 1, FPG.CAB.length).getDisplayValues()[0]);
    if (antes.estado === 'Anulada') throw new Error('Ya estaba anulado.');
    if (validar) validar(antes);
    sh.getRange(i + 2, 17, 1, 3).setValues([['Anulada', String(quien).split('#')[0], motivo]]);
    const o = fpgObj_(sh.getRange(i + 2, 1, 1, FPG.CAB.length).getDisplayValues()[0]);
    fpgLog_('Anulación', o, quien, desde, 'Motivo: ' + motivo + ' · era: ' + fpgDetalle_(antes));
    return o;
  } finally { lock.releaseLock(); }
}

/* ---------- panel (Financiero y administrador) ---------- */
function fpgPuede_(ptoken, quien) {
  const s = exigirSupervisor_(ptoken, quien);
  const m = apiMenusPerfil(s.nombre);
  if (!(s.admin || m.todo || (m.claves || []).indexOf(FPG.CLAVE_MENU) >= 0)) throw new Error('Tu perfil no tiene acceso a las formas de pago.');
  s.perfilFpg = s.admin ? 'Administrador' : (m.perfil || 'Panel');
  return s;
}

function apiFPGPanel(ptoken, quien) {
  const s = fpgPuede_(ptoken, quien);
  const lista = fpgFilas_().map(fpgObj_).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { fpgLog_('Consulta', null, s.nombre, s.perfilFpg, lista.length + ' registros'); } finally { lock.releaseLock(); }
  return {formas: FPG.FORMAS, lista: lista, integridad: fpgIntegridad_(lista)};
}

/** Marca (o quita, con recibo vacío) la entrega al centro comercial con su N° de recibo. ids = ['FP00001', ...] */
function apiFPGEntregar(ptoken, quien, ids, recibo) {
  const s = fpgPuede_(ptoken, quien);
  ids = (Array.isArray(ids) ? ids : [ids]).map(String);
  recibo = String(recibo == null ? '' : recibo).trim().replace(/^[=+\-@]+/, '').slice(0, 40);
  if (!ids.length) throw new Error('Elige al menos una factura.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = fpgHoja_(), n = sh.getLastRow() - 1; if (n < 1) return [];
    const col = sh.getRange(2, 1, n, 1).getDisplayValues().map(r => r[0]), out = [];
    ids.forEach(id => {
      const i = col.indexOf(id); if (i < 0) return;
      const antes = fpgObj_(sh.getRange(i + 2, 1, 1, FPG.CAB.length).getDisplayValues()[0]);
      if (antes.estado === 'Anulada') return;
      sh.getRange(i + 2, 14, 1, 3).setValues([[recibo ? hoy_() : '', recibo ? "'" + recibo : '', recibo ? s.nombre : '']]);
      const o = fpgObj_(sh.getRange(i + 2, 1, 1, FPG.CAB.length).getDisplayValues()[0]);
      fpgLog_(recibo ? 'Entrega' : 'Quita entrega', o, s.nombre, s.perfilFpg, (recibo ? 'Recibo ' + recibo : 'Antes: recibo ' + antes.recibo) + ' · ' + fpgDetalle_(o));
      out.push(o);
    });
    return out;
  } finally { lock.releaseLock(); }
}

function apiFPGAnularPanel(ptoken, quien, id, motivo) {
  const s = fpgPuede_(ptoken, quien);
  motivo = String(motivo || '').trim().replace(/^[=+\-@]+/, '').slice(0, 300);
  if (motivo.length < 5) throw new Error('Escribe el motivo de la anulación.');
  return fpgAnular_(id, s.nombre, s.perfilFpg, motivo);
}

/** Bitácora para el panel (más nueva primero, hasta 2000 líneas). */
function apiFPGBitacora(ptoken, quien) {
  fpgPuede_(ptoken, quien);
  const sh = ss_().getSheetByName(FPG.BIT);
  if (!sh || sh.getLastRow() < 2) return [];
  const n = sh.getLastRow() - 1, desde = Math.max(1, n - 1999);
  return sh.getRange(desde + 1, 1, n - desde + 1, 8).getDisplayValues().reverse()
    .map(r => ({fecha: fpgIso_(String(r[0]).replace(/^'/, '')), hora: String(r[1]).replace(/^'/, ''), accion: r[2], id: r[3], tienda: r[4], quien: r[5], desde: r[6], detalle: r[7]}));
}

/** La exportación también queda anotada. */
function apiFPGExporto(ptoken, quien, detalle) {
  const s = fpgPuede_(ptoken, quien);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { fpgLog_('Exportación', null, s.nombre, s.perfilFpg, String(detalle || '').slice(0, 300)); } finally { lock.releaseLock(); }
  return true;
}
