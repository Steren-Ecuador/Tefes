/**
 * fpg1 (Diego 16-nov-2026): registro de formas de pago de las facturas del POS Steren.
 * Asesores (asesor.html) y gerentes de tienda (tienda.html) registran: factura, forma de pago, n.º de pedido o comprobante (p. ej. los billetes
 * de Shopping Dólares), valor pagado con esa forma (con IVA) y, opcional, cliente, total de la factura y foto
 * (modelo: Condado/Shopping Dollars CONDADO/REgistro_transacciones_shopping_dolar y Mall Sol/Mobi Sol).
 * El perfil Financiero (y el administrador) ven todas las tiendas en el panel (Ventas › Formas de pago), filtran, exportan
 * y marcan la entrega al centro comercial con su N° de recibo.
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
    'Cliente', 'Valor de la factura', 'Foto', 'Entregado', 'N° recibo', 'Marcó entrega', 'Estado', 'Anuló', 'Motivo anulación', 'Detalle otra', 'Banco'],
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
    estado: r[16] || 'Vigente', anulo: r[17] || '', motivoAnula: r[18] || '', otra: r[19] || '', banco: r[20] || ''};
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
    o.foto, o.entregado, o.recibo, o.estado, o.motivoAnula].concat(o.otra || o.banco ? [o.otra] : []).concat(o.banco ? [o.banco] : []).join('|')).slice(0, 16);
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
  return 'Fact. ' + o.factura + ' · ' + o.forma + (o.otra ? ' (' + o.otra + ')' : '') + (o.banco ? ' · banco ' + o.banco : '') + ' · $' + Number(o.valor || 0).toFixed(2) + ' · pedido/comprobante ' + String(o.pedido).slice(0, 300) +
    (o.cliente ? ' · cliente ' + o.cliente : '') + (o.valorFac ? ' · total fact. $' + Number(o.valorFac).toFixed(2) : '') + (o.foto ? ' · con foto' : '');
}

/* ---------- tienda y asesor ---------- */
/** Los registros de su tienda de los últimos 60 días, el más nuevo primero (el asesor filtra los suyos en pantalla) */
function apiFPGLista(token) {
  const tienda = exigirTienda_(token).nombre, lim = sumarDiasIso_(hoy_(), -FPG.DIAS_TIENDA);
  return {formas: fpgFormasDe_(tienda), hoy: hoy_(), lista: fpgFilas_().map(fpgObj_).filter(x => x.tienda === tienda && x.fecha >= lim)
    .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora))};
}

function apiFPGRegistrar(token, d) {
  const tienda = exigirTienda_(token).nombre;
  d = d || {};
  const txt = (v, n) => String(v == null ? '' : v).trim().replace(/^[=+\-@]+/, '').slice(0, n || 200);
  const registro = txt(d.registro, 80), desde = d.desde === 'Asesor' ? 'Asesor' : 'Tienda';
  const factura = String(d.factura == null ? '' : d.factura).trim().replace(/\s+/g, '').slice(0, 30);
  const forma = txt(d.forma, 40), pedido = txt(d.pedido, 1500), valor = Math.round(fpgNum_(d.valor) * 100) / 100;
  const otra = forma === 'Otra' ? txt(d.otra, 100) : '', banco = forma === 'Transferencias' ? txt(d.banco, 40) : '';
  const cliente = txt(d.cliente, 100), valorFac = Math.round(fpgNum_(d.valorFac) * 100) / 100;
  if (!registro) throw new Error('Elige tu nombre.');
  asPersonaValida_(tienda, registro);
  if ((factura.match(/\d/g) || []).length < 3 || !/^[\d-]+$/.test(factura)) throw new Error('Revisa el número de factura (ej.: 005-001-000004800).');
  if (FPG.FORMAS.indexOf(forma) < 0) throw new Error('Elige la forma de pago.');
  if (fpgFormasDe_(tienda).indexOf(forma) < 0) throw new Error(forma + ' no se usa en ' + tienda + '.');
  if (forma === 'Otra' && otra.length < 3) throw new Error('Escribe cuál es la otra forma de pago.');
  if (forma === 'Transferencias' && banco.length < 3) throw new Error('Escribe el banco de la transferencia.');
  if (forma === 'Tipti' && pedido.replace(/\D/g, '').length !== 7) throw new Error('El pedido Tipti tiene 7 dígitos.');
  if (!pedido) throw new Error('Escribe el número de pedido o comprobante.');
  if (!(valor > 0)) throw new Error('Pon el valor con IVA.');
  if (valor > 100000) throw new Error('Revisa el valor: parece demasiado alto.');
  if (valorFac && valorFac < valor) throw new Error('El valor pagado con esta forma no puede ser mayor que el total de la factura.');
  const foto = /^https:\/\/drive\.google\.com\//.test(String(d.foto || '')) ? String(d.foto) : '';
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = fpgHoja_(), L = fpgFilas_();
    const solo = f => String(f || '').replace(/^'/, '').replace(/\D/g, '');
    if (L.some(r => r[3] === tienda && solo(r[6]) === solo(factura) && r[7] === forma && (forma !== 'Otra' || String(r[19] || '').toLowerCase() === otra.toLowerCase()) && r[16] !== 'Anulada'))
      throw new Error('Esa factura ya tiene registrada la forma de pago ' + forma + (otra ? ' (' + otra + ')' : '') + '.');
    const id = 'FP' + ('0000' + (Math.max(0, ...L.map(r => Number(String(r[0]).replace(/\D/g, '')) || 0)) + 1)).slice(-5);
    const fila = [id, hoy_(), Utilities.formatDate(new Date(), TZ, 'HH:mm'), tienda, registro, desde, "'" + factura, forma, "'" + pedido, valor,
      cliente, valorFac || '', foto, '', '', '', 'Vigente', '', '', otra, banco];
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
