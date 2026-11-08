/**
 * TEFES — Seguimiento de proformas del POS (pf2, Diego 2026-11-08: "Listo hagámoslo").
 * Cada proforma (pedido sin facturar del POS, transacción ZRECHAZO) le llega al asesor que la hizo como tarea en
 * Clientes › Proformas. El asesor anota cada contacto; la venta se marca cerrada sola cuando el pedido se factura.
 * El gerente ve todas las de su tienda; supervisores y Diego solo números (nunca datos del cliente).
 *
 * Pestañas de la hoja PRIVADA de claves (claves_()):
 *   "Proformas POS"          la llena la vuelta nocturna del POS (hilo POS), una fila por pedido en cada bajada:
 *                            Fecha bajada | Tienda | Documento | Creado el | Total | Usuario | Cód. vendedor | Nombre vendedor | Solicitante | Cliente | Celular | Correo | Productos
 *   "Proformas facturadas"   opcional, la llena el hilo POS: Documento | Tienda | Fecha factura | Factura
 *   "Vendedores POS"         Tienda | Código | Nombre en POS | Persona | Nota   (se completa sola cuando el nombre coincide; se corrige a mano)
 *   "Proformas"              la misma de Asesores.gs (manuales + POS); pf2 agrega columnas al final
 *   "Proformas seguimiento"  historial: Fecha | Hora | ID | Tienda | Persona | Canal | Resultado | Nota | Próximo contacto
 */
const PF2 = {
  POS: 'Proformas POS', FACT: 'Proformas facturadas', VEND: 'Vendedores POS', SEG: 'Proformas seguimiento',
  EXTRA: ['Origen', 'Documento', 'Correo', 'Motivo', 'Último resultado', 'Fuera del POS', 'Facturada el'],
  SEG_CAB: ['Fecha', 'Hora', 'ID', 'Tienda', 'Persona', 'Canal', 'Resultado', 'Nota', 'Próximo contacto'],
  VEND_CAB: ['Tienda', 'Código', 'Nombre en POS', 'Persona', 'Nota'],
  DIAS_IMPORTAR: 30, DIAS_VENCE: 30, SYNC_MIN: 20,
  MOTIVOS: ['Le pareció caro', 'No teníamos stock', 'Compró en otro lado', 'No responde', 'Ya no lo necesita', 'Otro']
};
const PX = {ORIGEN: 16, DOC: 17, CORREO: 18, MOTIVO: 19, RES: 20, FUERA: 21, FACT: 22};
const pf2Slug_ = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');

function pf2Hoja_() {
  const sh = pfHoja_(), cab = AS.PF_CAB.concat(PF2.EXTRA);
  if (sh.getLastColumn() < cab.length) sh.getRange(1, 1, 1, cab.length).setValues([cab]);
  return sh;
}
function pf2Filas_() {   // filas de "Proformas" con las columnas extra (vacías si aún no existen)
  const n = AS.PF_CAB.length + PF2.EXTRA.length;
  return asFilas_(AS.PF).map(r => { r = r.slice(); while (r.length < n) r.push(''); return r; });
}
function pf2SegHoja_() {
  const ss = claves_(); let sh = ss.getSheetByName(PF2.SEG);
  if (!sh) { sh = ss.insertSheet(PF2.SEG); sh.appendRow(PF2.SEG_CAB); sh.setFrozenRows(1); }
  return sh;
}
function pf2Obj_(r, H) {
  const o = pfObj_(r);
  o.origen = r[PX.ORIGEN] || 'Manual'; o.doc = String(r[PX.DOC] || '').replace(/^'/, ''); o.correo = r[PX.CORREO] || '';
  o.motivo = r[PX.MOTIVO] || ''; o.resultado = r[PX.RES] || ''; o.fuera = /^s/i.test(String(r[PX.FUERA] || '')); o.facturada = asIso_(r[PX.FACT]);
  o.hist = H ? (H[o.id] || []) : [];
  return o;
}
/** historial por ID: [{f, h, canal, res, nota, prox, persona}] del más viejo al más nuevo */
function pf2Hist_(tienda) {
  const H = {};
  asFilas_(PF2.SEG).forEach(r => { if (tienda && r[3] !== tienda) return;
    (H[r[2]] = H[r[2]] || []).push({f: asIso_(r[0]), h: r[1], persona: r[4], canal: r[5], res: r[6], nota: r[7], prox: asIso_(r[8])}); });
  return H;
}

/* ------------------------------------------------------------------ */
/* Sincronizar con la bajada del POS (a lo más cada 20 min, al abrir)  */
/* ------------------------------------------------------------------ */
function pf2Vendedores_() {
  const ss = claves_(); let sh = ss.getSheetByName(PF2.VEND);
  if (!sh) { sh = ss.insertSheet(PF2.VEND); sh.appendRow(PF2.VEND_CAB); sh.setFrozenRows(1); }
  const M = {}; asFilas_(PF2.VEND).forEach(r => { if (r[0] && r[1]) M[r[0] + '|' + String(r[1]).trim().toUpperCase()] = nombreCorto_(r[3]) || ''; });
  return {sh: sh, M: M};
}
/** Persona de Personal cuyo nombre corto o primer nombre coincide (sin ambigüedad) con el nombre del vendedor en el POS */
function pf2Adivinar_(tienda, nombrePos) {
  const g = vfGente_(tienda).map(x => x.nombre), w = String(nombrePos || '').trim().split(/\s+/).map(pf2Slug_).filter(Boolean);
  if (!w.length) return '';
  let c = g.filter(n => { const p = n.split(' ').map(pf2Slug_); return w.every(x => p.indexOf(x) >= 0); });
  if (c.length !== 1) c = g.filter(n => pf2Slug_(n.split(' ')[0]) === w[0]);
  return c.length === 1 ? c[0] : '';
}
function pf2Sync_(forzar) {
  const cache = CacheService.getScriptCache();
  if (!forzar && cache.get('pf2_sync')) return;
  const lock = LockService.getScriptLock(); if (!lock.tryLock(8000)) return;
  try {
    cache.put('pf2_sync', '1', PF2.SYNC_MIN * 60);
    const POS = asFilas_(PF2.POS); if (!POS.length) return;
    const hoy = hoy_(), limImp = sumarDiasIso_(hoy, -PF2.DIAS_IMPORTAR), ult = {};
    POS.forEach(r => { const f = asIso_(r[0]), t = String(r[1]).trim(); if (t && f > (ult[t] || '')) ult[t] = f; });
    const ACT = {}, TODOS = {};   // pedidos de la última bajada de cada tienda / de cualquier bajada (la fila más nueva)
    POS.forEach(r => { const t = String(r[1]).trim(), d = String(r[2]).replace(/^'/, '').trim(), f = asIso_(r[0]); if (!d) return;
      if (f === ult[t]) ACT[t + '|' + d] = r;
      if (!TODOS[t + '|' + d] || asIso_(TODOS[t + '|' + d][0]) < f) TODOS[t + '|' + d] = r; });
    const FACT = {}; asFilas_(PF2.FACT).forEach(r => { const d = String(r[0]).replace(/^'/, '').trim(); if (d) FACT[d] = asIso_(r[2]) || hoy; });
    const V = pf2Vendedores_(), nuevosV = [];
    const persona = (t, cod, nom) => { const k = t + '|' + String(cod || '').trim().toUpperCase();
      if (!(k in V.M)) { const p = pf2Adivinar_(t, nom); V.M[k] = p; nuevosV.push([t, String(cod || '').trim(), String(nom || '').trim(), p, p ? 'Automático: revisar' : 'Falta: escribir la persona']); }
      return V.M[k]; };
    const sh = pf2Hoja_(), F = pf2Filas_(), ya = {};
    F.forEach((r, i) => { if (r[PX.ORIGEN] === 'POS' && r[PX.DOC]) ya[r[PC.TIENDA] + '|' + String(r[PX.DOC]).replace(/^'/, '')] = i; });
    const set = (i, c, v) => sh.getRange(i + 2, c + 1).setValue(v);
    // 1) pedidos nuevos (de cualquier bajada) → filas nuevas
    const nuevas = [];
    Object.keys(TODOS).forEach(k => {
      const r = TODOS[k], t = String(r[1]).trim(), doc = String(r[2]).replace(/^'/, '').trim(), creado = asIso_(r[3]) || hoy;
      const cel = String(r[10] || '').replace(/[^\d+]/g, '');
      if (!(k in ya) && creado < limImp) return;
      const per = persona(t, r[6], r[7]);
      if (k in ya) { const i = ya[k], f = F[i];   // completar datos que antes no venían
        if (!String(f[PC.CEL]).replace(/\D/g, '') && cel) set(i, PC.CEL, "'" + cel);
        if (!f[PX.CORREO] && r[11]) set(i, PX.CORREO, String(r[11]).trim());
        if (!f[PC.ASESOR] && per) set(i, PC.ASESOR, per);
        if (r[12] && /^Proforma /.test(f[PC.PROD])) set(i, PC.PROD, String(r[12]).slice(0, 300));
        return; }
      if (creado < limImp) return;
      const fila = new Array(AS.PF_CAB.length + PF2.EXTRA.length).fill('');
      fila[PC.ID] = 'PV' + doc; fila[PC.FECHA] = "'" + creado; fila[PC.HORA] = ''; fila[PC.TIENDA] = t; fila[PC.ASESOR] = per;
      fila[PC.CLI] = String(r[9] || '').trim() || 'Cliente sin nombre'; fila[PC.CEL] = cel ? "'" + cel : ''; fila[PC.PROD] = String(r[12] || '').trim().slice(0, 300) || 'Proforma ' + doc;
      fila[PC.MONTO] = asNum_(r[4]); fila[PC.CONT] = "'" + (sumarDiasIso_(creado, 1) < hoy ? hoy : sumarDiasIso_(creado, 1)); fila[PC.ACEPTA] = 'POS';
      fila[PC.ESTADO] = 'Abierta'; fila[PC.N] = 0; fila[PX.ORIGEN] = 'POS'; fila[PX.DOC] = "'" + doc; fila[PX.CORREO] = String(r[11] || '').trim();
      nuevas.push(fila);
    });
    if (nuevas.length) { sh.getRange(sh.getLastRow() + 1, 1, nuevas.length, nuevas[0].length).setValues(nuevas); F.push.apply(F, nuevas.map(x => x.map(v => String(v).replace(/^'/, '')))); }
    // 2) abiertas que ya no están en la bajada: facturada (si el POS lo confirma) o "fuera del POS" (el asesor confirma)
    F.forEach((r, i) => {
      if (r[PX.ORIGEN] !== 'POS' || (r[PC.ESTADO] || 'Abierta') !== 'Abierta') return;
      const t = r[PC.TIENDA], doc = String(r[PX.DOC]).replace(/^'/, ''), k = t + '|' + doc;
      if (FACT[doc]) { set(i, PC.ESTADO, 'Compró'); set(i, PC.CIERRE, "'" + FACT[doc]); set(i, PX.FACT, "'" + FACT[doc]); set(i, PX.RES, 'Facturada en el POS'); return; }
      if (ult[t] && !(k in ACT) && !/^s/i.test(r[PX.FUERA])) set(i, PX.FUERA, 'Sí');
      if (asIso_(r[PC.FECHA]) < sumarDiasIso_(hoy, -PF2.DIAS_VENCE)) { set(i, PC.ESTADO, 'No compró'); set(i, PC.CIERRE, "'" + hoy); set(i, PX.MOTIVO, 'Venció (30 días)'); }
    });
    if (nuevosV.length) V.sh.getRange(V.sh.getLastRow() + 1, 1, nuevosV.length, PF2.VEND_CAB.length).setValues(nuevosV);
  } finally { lock.releaseLock(); }
}
/** Para correr a mano desde el editor (o con un activador después de la bajada nocturna) */
function sincronizarProformasPOS() { pf2Sync_(true); }

/* ------------------------------------------------------------------ */
/* Asesor                                                              */
/* ------------------------------------------------------------------ */
/** Reemplaza a asProformas_ en apiAsesor: sus proformas (abiertas y cerradas de los últimos 30 días) con historial */
function asProformas2_(tienda, persona) {
  try { pf2Sync_(false); } catch (e) {}
  const lim = sumarDiasIso_(hoy_(), -30), H = pf2Hist_(tienda);
  return pf2Filas_().filter(r => r[PC.ID] && r[PC.TIENDA] === tienda && nombreCorto_(r[PC.ASESOR]) === persona).map(r => pf2Obj_(r, H))
    .filter(p => p.estado === 'Abierta' || (p.cierre || p.creada) >= lim);
}
/** primer contacto de cada proforma (fecha) */
function pf2Primero_(o, H) { const h = H[o.id]; return h && h.length ? h[0].f : (o.ultimo || ''); }
/** Números para motivar: mes, racha, medallas, ranking de cierre de la tienda y logros recientes (sin datos de clientes entre compañeros) */
function pfJuego_(tienda, persona) {
  const hoy = hoy_(), mes = hoy.slice(0, 7), H = pf2Hist_(tienda);
  const T = pf2Filas_().filter(r => r[PC.ID] && r[PC.TIENDA] === tienda).map(r => pf2Obj_(r, null));
  const delMes = o => o.creada.slice(0, 7) === mes, cerro = o => o.estado === 'Compró';
  const aTiempo = o => { const p = pf2Primero_(o, H); return !!p && p <= sumarDiasIso_(o.creada, 2); };
  const st = L => { const m = L.filter(delMes), c = L.filter(o => cerro(o) && (o.cierre || '').slice(0, 7) === mes);
    return {n: m.length, monto: m.reduce((a, o) => a + o.monto, 0), cerradas: c.length, cerradoUsd: c.reduce((a, o) => a + o.monto, 0),
      perdidas: L.filter(o => o.estado === 'No compró' && (o.cierre || '').slice(0, 7) === mes).length,
      aTiempo: m.filter(o => sumarDiasIso_(o.creada, 2) < hoy || pf2Primero_(o, H)).filter(aTiempo).length,
      vencibles: m.filter(o => sumarDiasIso_(o.creada, 2) < hoy || pf2Primero_(o, H)).length}; };
  const mias = T.filter(o => nombreCorto_(o.asesor) === persona);
  // racha: proformas seguidas (de la más nueva a la más vieja) atendidas dentro de 48 h; las que aún están en plazo no cortan
  let racha = 0;
  mias.slice().sort((a, b) => a.creada < b.creada ? 1 : -1).some(o => {
    if (aTiempo(o)) { racha++; return false; }
    return sumarDiasIso_(o.creada, 2) < hoy;   // vencida sin contacto: corta la racha
  });
  const porPersona = {}; T.forEach(o => { const n = nombreCorto_(o.asesor); if (n) (porPersona[n] = porPersona[n] || []).push(o); });
  const ranking = Object.keys(porPersona).map(n => { const s = st(porPersona[n]); return {nombre: n, n: s.n, cerradas: s.cerradas, pct: s.n >= 3 ? s.cerradas / s.n : null}; })
    .filter(x => x.n).sort((a, b) => (b.pct == null ? -1 : b.pct) - (a.pct == null ? -1 : a.pct) || b.cerradas - a.cerradas);
  const lim3 = sumarDiasIso_(hoy, -3);
  const logros = T.filter(o => cerro(o) && o.cierre >= lim3 && nombreCorto_(o.asesor)).map(o => ({nombre: nombreCorto_(o.asesor), monto: o.monto, fecha: o.cierre, id: o.id}))
    .sort((a, b) => a.fecha < b.fecha ? 1 : -1).slice(0, 5);
  const sT = st(T);
  return {mes: st(mias), racha: racha, cierres: mias.filter(cerro).length, ranking: ranking, logros: logros,
    tienda: {n: sT.n, cerradas: sT.cerradas, pct: sT.n ? sT.cerradas / sT.n : 0}, motivos: PF2.MOTIVOS};
}
/** El asesor anota un contacto (y, si quiere, cierra: Compró / No compró con motivo) */
function apiPFSeguir(token, id, persona, d) {
  const tienda = exigirTienda_(token).nombre; d = d || {};
  const txt = (v, n) => String(v == null ? '' : v).trim().slice(0, n || 200);
  const canal = txt(d.canal, 30), res = txt(d.resultado, 60), nota = txt(d.nota, 500), estado = txt(d.estado, 20), motivo = txt(d.motivo, 60);
  const cel = txt(d.cel, 20).replace(/[^\d+]/g, '');
  if (cel && cel.replace(/\D/g, '').length < 9) throw new Error('El celular debe tener al menos 9 números.');
  if (!res && !estado) throw new Error('Cuéntanos qué pasó.');
  if (estado && ['Compró', 'No compró'].indexOf(estado) < 0) throw new Error('Estado no válido.');
  const hoy = hoy_(); let prox = asIso_(d.proximo);
  if (!estado) { if (!/^\d{4}-\d{2}-\d{2}$/.test(prox) || prox < hoy) throw new Error('Elige cuándo vuelves a contactarlo.'); } else prox = '';
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = pf2Hoja_(), F = pf2Filas_(), i = F.findIndex(r => r[PC.ID] === id);
    if (i < 0) throw new Error('No encontré esa proforma.');
    const r = F[i]; if (r[PC.TIENDA] !== tienda || nombreCorto_(r[PC.ASESOR]) !== persona) throw new Error('Esa proforma no es tuya.');
    const fila = i + 2, set = (c, v) => sh.getRange(fila, c + 1).setValue(v);
    pf2SegHoja_().appendRow(["'" + hoy, Utilities.formatDate(new Date(), TZ, 'HH:mm'), id, tienda, persona, canal, res || estado, nota, prox ? "'" + prox : '']);
    set(PC.ULT, "'" + hoy); set(PC.N, (Number(r[PC.N]) || 0) + 1); set(PX.RES, res || estado);
    if (nota) set(PC.NOTA, nota);
    if (cel) set(PC.CEL, "'" + cel);
    if (prox) set(PC.CONT, "'" + prox);
    if (estado) { set(PC.ESTADO, estado); set(PC.CIERRE, "'" + hoy); if (estado === 'No compró') set(PX.MOTIVO, motivo || 'Otro'); }
    const fresca = sh.getRange(fila, 1, 1, AS.PF_CAB.length + PF2.EXTRA.length).getDisplayValues()[0];
    return pf2Obj_(fresca, pf2Hist_(tienda));
  } finally { lock.releaseLock(); }
}

/* ------------------------------------------------------------------ */
/* Gerente de tienda (Index.html): todas las de su tienda              */
/* ------------------------------------------------------------------ */
function apiPFTienda(token) {
  const tienda = exigirTienda_(token).nombre;
  try { pf2Sync_(false); } catch (e) {}
  const hoy = hoy_(), lim = sumarDiasIso_(hoy, -30), H = pf2Hist_(tienda);
  const L = pf2Filas_().filter(r => r[PC.ID] && r[PC.TIENDA] === tienda).map(r => pf2Obj_(r, H))
    .filter(p => p.estado === 'Abierta' || (p.cierre || p.creada) >= lim)
    .map(p => Object.assign(p, {asesor: nombreCorto_(p.asesor), espera: p.estado === 'Abierta' && !p.hist.length && sumarDiasIso_(p.creada, 2) < hoy}));
  return {tienda: tienda, filas: L, gente: vfGente_(tienda).map(g => g.nombre), juego: pfJuego_(tienda, '')};
}
function apiPFReasignar(token, id, persona) {
  const tienda = exigirTienda_(token).nombre; persona = nombreCorto_(persona);
  asPersonaValida_(tienda, persona);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = pf2Hoja_(), F = pf2Filas_(), i = F.findIndex(r => r[PC.ID] === id && r[PC.TIENDA] === tienda);
    if (i < 0) throw new Error('No encontré esa proforma.');
    sh.getRange(i + 2, PC.ASESOR + 1).setValue(persona);
    pf2SegHoja_().appendRow(["'" + hoy_(), Utilities.formatDate(new Date(), TZ, 'HH:mm'), id, tienda, 'Gerente', '', 'Reasignada a ' + persona, '', '']);
    return true;
  } finally { lock.releaseLock(); }
}

/* ------------------------------------------------------------------ */
/* Supervisores y admin: SOLO números (sin clientes, sin notas)        */
/* ------------------------------------------------------------------ */
function pf2Resumen_(desde, hasta) {
  try { pf2Sync_(false); } catch (e) {}
  const hoy = hoy_(), H = pf2Hist_(''), T = {}, M = {};
  pf2Filas_().filter(r => r[PC.ID]).map(r => pf2Obj_(r, null)).forEach(o => {
    const t = T[o.tienda] = T[o.tienda] || {tienda: o.tienda, n: 0, monto: 0, aTiempo: 0, evaluables: 0, sinContacto: 0, cerradas: 0, cerradoUsd: 0, perdidas: 0, abiertas: 0};
    const enRango = f => f && f >= desde && f <= hasta, prim = pf2Primero_(o, H);
    if (enRango(o.creada)) { t.n++; t.monto += o.monto;
      if (prim || sumarDiasIso_(o.creada, 2) < hoy) { t.evaluables++; if (prim && prim <= sumarDiasIso_(o.creada, 2)) t.aTiempo++; } }
    if (o.estado === 'Abierta') { t.abiertas++; if (!prim && sumarDiasIso_(o.creada, 2) < hoy) t.sinContacto++; }
    if (o.estado === 'Compró' && enRango(o.cierre)) { t.cerradas++; t.cerradoUsd += o.monto; }
    if (o.estado === 'No compró' && enRango(o.cierre)) { t.perdidas++; const m = o.motivo || 'Otro'; M[m] = (M[m] || 0) + 1; }
  });
  return {desde: desde, hasta: hasta, tiendas: Object.keys(T).map(k => T[k]).sort((a, b) => b.n - a.n), motivos: M};
}
/** Panel de supervisores: periodo 'semana' (lunes a hoy), 'mes' (este mes) o 'mesAnt' */
function apiPFPanel(ptoken, periodo) {
  if (!panelValido_(ptoken)) throw new Error('Enlace no válido.');
  const hoy = hoy_(), d = new Date(hoy + 'T12:00:00'), dow = (d.getDay() + 6) % 7;
  if (periodo === 'semana') return pf2Resumen_(sumarDiasIso_(hoy, -dow), hoy);
  if (periodo === 'mesAnt') { const p = new Date(d.getFullYear(), d.getMonth() - 1, 1), u = new Date(d.getFullYear(), d.getMonth(), 0);
    return pf2Resumen_(Utilities.formatDate(p, TZ, 'yyyy-MM-dd'), Utilities.formatDate(u, TZ, 'yyyy-MM-dd')); }
  return pf2Resumen_(hoy.slice(0, 8) + '01', hoy);
}
