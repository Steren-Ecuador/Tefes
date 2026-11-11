/**
 * TEFES — Proformas del call center/web en la página Avisos (pf4, Diego 2026-11-11: "ponerle a Christian sus proformas en la app").
 * Christian ya usa Avisos TEFES (Mi área, m=cc). Esa página llama aquí con su clave de área; la clave vive SOLO en la
 * pestaña privada "Accesos proformas" de CLAVES:  Clave | Tienda en la app | Persona | Nota
 * Ve todas las proformas de su "tienda" (Call center/web, también las de MTORRES) y anota contactos como un asesor.
 */
function pf4Acceso_(clave) {
  clave = String(clave || '').trim();
  if (clave.length < 20) throw new Error('Enlace no válido.');
  const r = asFilas_('Accesos proformas').find(x => String(x[0]).trim() === clave);
  if (!r || !r[1]) throw new Error('Enlace no válido.');
  return {tienda: String(r[1]).trim(), persona: nombreCorto_(r[2]) || String(r[2] || '').trim()};
}
/** Sus proformas (abiertas y cerradas de los últimos 30 días) con historial y datos de contacto */
function apiPFCC(clave) {
  const A = pf4Acceso_(clave);
  try { pf2Sync_(false); } catch (e) {}
  const hoy = hoy_(), lim = sumarDiasIso_(hoy, -30), H = pf2Hist_(A.tienda);
  const L = pf2Filas_().filter(r => r[PC.ID] && r[PC.TIENDA] === A.tienda).map(r => pf2Obj_(r, H))
    .filter(p => p.estado === 'Abierta' || (p.cierre || p.creada) >= lim)
    .map(p => Object.assign(p, {asesor: nombreCorto_(p.asesor), tiendaPos: '', espera: p.estado === 'Abierta' && !p.hist.length && sumarDiasIso_(p.creada, 2) < hoy}));
  const T = {}; pf2Filas_().forEach(r => { if (r[PC.TIENDA] === A.tienda) T[r[PC.ID]] = r[PX.TPOS] || ''; });
  L.forEach(p => p.tiendaPos = T[p.id] || '');
  const mes = hoy.slice(0, 7), delMes = L.filter(p => p.creada.slice(0, 7) === mes);
  return {persona: A.persona, tienda: A.tienda, hoy: hoy, filas: L, motivos: PF2.MOTIVOS,
    mes: {n: delMes.length, cerradas: L.filter(p => p.estado === 'Compró' && (p.cierre || '').slice(0, 7) === mes).length,
      cerradoUsd: L.filter(p => p.estado === 'Compró' && (p.cierre || '').slice(0, 7) === mes).reduce((a, p) => a + p.monto, 0)}};
}
/** Anota un contacto o cierra (Compró / No compró), igual que el asesor */
function apiPFCCSeguir(clave, id, d) {
  const A = pf4Acceso_(clave);
  return pf2Seguir_(A.tienda, String(id || ''), A.persona, d, false);
}
