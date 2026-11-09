/* mp3 + mp5: menús por perfil (Diego 9-nov). Lee CLAVES 'Menús por perfil' (A Perfil | B Menú | C Opción | D Clave | E Ve | F Orden menú | G Orden opción)
   y Supervisores (Nombre, Cargo, Perfil). Devuelve {perfil, todo, claves, orden}: claves = lo que ve; orden = todas las claves del perfil ordenadas por F y G. */
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
    const mp = ss.getSheetByName('Menús por perfil');
    const R = mp ? mp.getDataRange().getDisplayValues().slice(1).filter(r => String(r[0]).trim() === perfil && String(r[3]).trim()) : [];
    const num = x => { const n = parseFloat(String(x || '').replace(',', '.')); return isNaN(n) ? 1e9 : n; };
    const orden = R.map((r, i) => ({k: String(r[3]).trim(), m: num(r[5]), o: num(r[6]), i: i}))
      .sort((a, b) => a.m - b.m || a.o - b.o || a.i - b.i).map(x => x.k);
    if (/^admin/i.test(perfil) || !R.length) return {perfil: perfil, todo: true, orden: orden};
    return {perfil: perfil, todo: false, orden: orden, claves: R.filter(r => /^s[ií]$/i.test(String(r[4]).trim())).map(r => String(r[3]).trim())};
  } catch (e) { return {perfil: '', todo: true, error: String(e && e.message || e)}; }
}
