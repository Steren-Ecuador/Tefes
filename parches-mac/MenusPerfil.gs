/**
 * mp3 (Diego 9-nov-2026): qué menús y opciones ve cada perfil en el panel de supervisores.
 * Perfil: Supervisores!J ('Perfil'); si está vacía, Cargo (I): Gerente → Gerentes, otro → Supervisores.
 * Claves con Ve = 'Sí' en la pestaña 'Menús por perfil' de la hoja de claves (A Perfil | B Menú | C Opción | D Clave | E Ve).
 * Administrador, o un perfil sin filas en la pestaña, ve todo (todo: true).
 */
function apiMenusPerfil(quien) {
  try {
    const nombre = String(quien || '').split('#')[0].trim().toLowerCase();
    const ss = SpreadsheetApp.openById(CLAVES_ID);
    const sv = ss.getSheetByName('Supervisores'); if (!sv || !nombre) return {perfil: '', todo: true};
    const filas = sv.getDataRange().getDisplayValues();
    const h = filas[0].map(x => String(x).trim().toLowerCase());
    const cN = h.indexOf('nombre'), cP = h.indexOf('perfil'), cC = h.indexOf('cargo');
    const f = filas.slice(1).find(r => String(r[cN < 0 ? 0 : cN]).trim().toLowerCase() === nombre);
    if (!f) return {perfil: '', todo: true};
    let perfil = cP >= 0 ? String(f[cP] || '').trim() : '';
    if (!perfil) perfil = /gerente/i.test(cC >= 0 ? String(f[cC] || '') : '') ? 'Gerentes' : 'Supervisores';
    if (/^admin/i.test(perfil)) return {perfil: perfil, todo: true};
    const mp = ss.getSheetByName('Menús por perfil'); if (!mp) return {perfil: perfil, todo: true};
    const R = mp.getDataRange().getDisplayValues().slice(1).filter(r => String(r[0]).trim() === perfil);
    if (!R.length) return {perfil: perfil, todo: true};
    return {perfil: perfil, todo: false, claves: R.filter(r => /^s[ií]$/i.test(String(r[4]).trim())).map(r => String(r[3]).trim()).filter(Boolean)};
  } catch (e) { return {perfil: '', todo: true, error: String(e && e.message || e)}; }
}
