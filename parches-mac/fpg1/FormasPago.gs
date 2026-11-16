/**
 * fpg1 (Diego 16-nov-2026): registro de formas de pago de las facturas del POS Steren.
 * Asesores (asesor.html) y gerentes de tienda (tienda.html) registran: factura, forma de pago, n.º de pedido y valor con IVA.
 * El perfil Financiero (y el administrador) ven todas las tiendas en el panel (Ventas › Formas de pago), con filtros y exportación.
 * Datos: pestaña 'Formas de pago' de la Base (se crea sola con el primer registro).
 * Una factura puede pagarse con varias formas: se acepta una fila por cada forma; se rechaza la misma factura + misma forma dos veces.
 */
const FPG = {
  HOJA: 'Formas de pago',
  CAB: ['ID', 'Fecha registro', 'Hora', 'Tienda', 'Registró', 'Desde', 'N° factura', 'Forma de pago', 'N° de pedido', 'Valor con IVA'],
  FORMAS: ['Tarjeta de crédito', 'Tarjeta de débito', 'Transferencia', 'Steren Card', 'Crédito directo', 'Cheque', 'Efectivo', 'Otra'],
  DIAS_TIENDA: 60,
  CLAVE_MENU: 'ventas/formaspago'
};

function fpgHoja_() {
  const ss = ss_();
  let sh = ss.getSheetByName(FPG.HOJA);
  if (!sh) { sh = ss.insertSheet(FPG.HOJA); sh.appendRow(FPG.CAB); sh.setFrozenRows(1); }
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
    factura: String(r[6] || '').replace(/^'/, ''), forma: r[7], pedido: String(r[8] || '').replace(/^'/, ''), valor: fpgNum_(r[9])};
}

/** Tienda o asesor: los registros de su tienda de los últimos 60 días, el más nuevo primero (el asesor filtra los suyos en pantalla) */
function apiFPGLista(token) {
  const tienda = exigirTienda_(token).nombre, lim = sumarDiasIso_(hoy_(), -FPG.DIAS_TIENDA);
  return {formas: FPG.FORMAS, lista: fpgFilas_().map(fpgObj_).filter(x => x.tienda === tienda && x.fecha >= lim)
    .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora))};
}

function apiFPGRegistrar(token, d) {
  const tienda = exigirTienda_(token).nombre;
  d = d || {};
  const txt = (v, n) => String(v == null ? '' : v).trim().replace(/^[=+\-@]+/, '').slice(0, n || 200);
  const registro = txt(d.registro, 80), desde = d.desde === 'Asesor' ? 'Asesor' : 'Tienda';
  const factura = String(d.factura == null ? '' : d.factura).trim().replace(/\s+/g, '').slice(0, 30);
  const forma = txt(d.forma, 40), pedido = txt(d.pedido, 40), valor = Math.round(fpgNum_(d.valor) * 100) / 100;
  if (!registro) throw new Error('Elige tu nombre.');
  asPersonaValida_(tienda, registro);
  if ((factura.match(/\d/g) || []).length < 3 || !/^[\d-]+$/.test(factura)) throw new Error('Revisa el número de factura (ej.: 005-001-000004800).');
  if (FPG.FORMAS.indexOf(forma) < 0) throw new Error('Elige la forma de pago.');
  if (!pedido) throw new Error('Escribe el número de pedido.');
  if (!(valor > 0)) throw new Error('Pon el valor con IVA.');
  if (valor > 100000) throw new Error('Revisa el valor: parece demasiado alto.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = fpgHoja_(), L = fpgFilas_();
    const solo = f => String(f || '').replace(/^'/, '').replace(/\D/g, '');
    if (L.some(r => r[3] === tienda && solo(r[6]) === solo(factura) && r[7] === forma)) throw new Error('Esa factura ya tiene registrada la forma de pago ' + forma + '.');
    const id = 'FP' + ('0000' + (Math.max(0, ...L.map(r => Number(String(r[0]).replace(/\D/g, '')) || 0)) + 1)).slice(-5);
    const fila = [id, hoy_(), Utilities.formatDate(new Date(), TZ, 'HH:mm'), tienda, registro, desde, "'" + factura, forma, "'" + pedido, valor];
    sh.appendRow(fila);
    fila[6] = factura; fila[8] = pedido;
    return fpgObj_(fila.map(String));
  } finally { lock.releaseLock(); }
}

/** Panel: solo administrador, perfil Financiero o quien tenga marcado Ventas › Formas de pago en 'Menús por perfil'. Todas las tiendas. */
function apiFPGPanel(ptoken, quien) {
  const s = exigirSupervisor_(ptoken, quien);
  const m = apiMenusPerfil(s.nombre);
  if (!(s.admin || m.todo || (m.claves || []).indexOf(FPG.CLAVE_MENU) >= 0)) throw new Error('Tu perfil no tiene acceso a las formas de pago.');
  return {formas: FPG.FORMAS, lista: fpgFilas_().map(fpgObj_).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora))};
}
