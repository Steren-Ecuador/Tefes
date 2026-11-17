/**
 * pa1 — Perfil del asesor guardado en la hoja (Diego 17-nov-2026: "deberías tener esa información de todos").
 * Antes el perfil de bienvenida (foto, apodo, cumpleaños, motivación, sueño, qué le gusta vender, reconocimiento)
 * quedaba SOLO en el celular de cada asesor. Ahora se guarda en la pestaña PRIVADA "Perfil asesores" de CLAVES.
 *   - Al abrir la app: si la hoja tiene el perfil, el teléfono lo usa (no vuelve a preguntar en otro equipo).
 *   - Si la hoja no lo tiene pero el teléfono sí (lo llenó antes de pa1), el teléfono lo sube solo (recuperación).
 * Columnas: Tienda | Persona | Apodo | Cumpleaños (MM-DD) | Motivo | Sueño | Le gusta vender | Reconocimiento | Foto | Actualizado | Desde | Origen
 * La foto va como imagen pequeña (data:image/jpeg, ~200 px) dentro de la celda: nunca sale de la hoja privada.
 */
const PA = {
  HOJA: 'Perfil asesores',
  CAB: ['Tienda', 'Persona', 'Apodo', 'Cumpleaños (MM-DD)', 'Motivo', 'Sueño', 'Le gusta vender', 'Reconocimiento', 'Foto', 'Actualizado', 'Desde', 'Origen'],
  FOTO_MAX: 48000
};

function paHoja_() {
  const ss = claves_();
  let sh = ss.getSheetByName(PA.HOJA);
  if (!sh) {
    sh = ss.insertSheet(PA.HOJA, ss.getNumSheets());   // al final: la pestaña Claves debe seguir primera
    sh.getRange(1, 1, 1, PA.CAB.length).setValues([PA.CAB]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('D:D').setNumberFormat('@');
    sh.setColumnWidth(9, 120);
  }
  return sh;
}

function paFila_(sh, tienda, persona) {
  const n = sh.getLastRow(); if (n < 2) return 0;
  const v = sh.getRange(2, 1, n - 1, 2).getDisplayValues();
  for (let i = 0; i < v.length; i++) if (v[i][0] === tienda && v[i][1] === persona) return i + 2;
  return 0;
}

function paLimpio_(p) {
  p = p || {};
  const t = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
  let foto = String(p.foto || '');
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(foto) || foto.length > PA.FOTO_MAX) foto = '';
  const cumple = /^\d{2}-\d{2}$/.test(String(p.cumple || '')) ? String(p.cumple) : '';
  const vender = (Array.isArray(p.vender) ? p.vender : []).map(x => t(x, 20)).filter(Boolean).slice(0, 10);
  return {foto: foto, apodo: t(p.apodo, 40), cumple: cumple, motivo: t(p.motivo, 30), sueno: t(p.sueno, 80), vender: vender, recon: t(p.recon, 20)};
}

/** Perfil guardado de la persona (o null si aún no lo tiene). */
function apiPerfilAsesor(token, persona) {
  const tienda = exigirTienda_(token).nombre; persona = String(persona || '').trim();
  asPersonaValida_(tienda, persona);
  const sh = claves_().getSheetByName(PA.HOJA); if (!sh) return null;
  const f = paFila_(sh, tienda, persona); if (!f) return null;
  const r = sh.getRange(f, 1, 1, PA.CAB.length).getDisplayValues()[0];
  return {apodo: r[2], cumple: r[3].replace(/^'/, ''), motivo: r[4], sueno: r[5], vender: r[6] ? r[6].split(/\s*,\s*/) : [], recon: r[7], foto: r[8], actualizado: r[9]};
}

/** Guarda (o reemplaza) el perfil. origen: 'bienvenida' | 'edición' | 'recuperado del teléfono'. */
function apiPerfilGuardar(token, persona, p, origen, desde) {
  const tienda = exigirTienda_(token).nombre; persona = String(persona || '').trim();
  asPersonaValida_(tienda, persona);
  const d = paLimpio_(p);
  if (!d.foto && !d.apodo && !d.motivo) throw new Error('Perfil vacío.');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = paHoja_(), f = paFila_(sh, tienda, persona) || sh.getLastRow() + 1;
    const ahora = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');
    sh.getRange(f, 1, 1, PA.CAB.length).setValues([[tienda, persona, d.apodo, d.cumple ? "'" + d.cumple : '', d.motivo, d.sueno, d.vender.join(', '), d.recon, d.foto,
      ahora, String(desde || '').slice(0, 20), String(origen || 'bienvenida').slice(0, 30)]]);
  } finally { lock.releaseLock(); }
  try { registrarAccion_('Tienda', tienda, 'Perfil asesor · ' + persona + ' · ' + String(origen || 'bienvenida').slice(0, 30)); } catch (e) {}
  return {ok: true};
}

/** Para el admin: quién de cada tienda tiene perfil (sin foto ni datos personales). */
function paResumen_() {
  const sh = claves_().getSheetByName(PA.HOJA);
  const v = sh && sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, PA.CAB.length).getDisplayValues() : [];
  return v.map(r => ({tienda: r[0], persona: r[1], foto: !!r[8], actualizado: r[9], origen: r[11]}));
}
