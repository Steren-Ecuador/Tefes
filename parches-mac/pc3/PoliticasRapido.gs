/**
 * pc3 (16-nov-2026): Políticas y Guías de cada tienda quedan precalculadas, como el inventario (l10).
 * - revisarNotificaciones (cada 5 min) llama a pc3Precalcular_(): si cambió la hoja Políticas o Guías, o pasaron
 *   3 horas, arma las de todas las tiendas y las deja en caché. Si nada cambió, no hace nada (no gasta tiempo).
 * - Cuando alguien aprueba una política o confirma una guía, se borra la copia de su tienda (pc3Tocar_)
 *   y su siguiente carga la calcula al momento, así nadie ve una aprobación atrasada.
 * - La carga de la tienda (pc1Leer_ → pc3Leer_) solo lee la caché: no abre ninguna hoja.
 */
const PC3_SEG = 21600;   // 6 h (máximo de CacheService); el precálculo la renueva cada 3 horas

function pc3Clave_(q, t) { return ('pc3_' + q + '_' + t).slice(0, 200); }

/** Lee de la caché; si no está, la calcula con f y la guarda */
function pc3Leer_(q, tk, f) {
  const c = CacheService.getScriptCache();
  try { const v = pc3Get_(c, pc3Clave_(q, tk)); if (v) return v; } catch (e) {}
  const r = f();
  try { pc3Put_(c, pc3Clave_(q, tk), r); } catch (e) {}
  return r;
}

/** Borra la copia de una tienda (después de una aprobación o confirmación) */
function pc3Tocar_(q, tienda) { try { CacheService.getScriptCache().remove(pc3Clave_(q, tienda)); } catch (e) {} }

/** Guarda una lista; los textos HTML largos van en claves aparte (límite de 100 KB por entrada) */
function pc3Put_(c, k, r) {
  const H = {}, s = (r || []).map((x, i) => {
    if (!x || typeof x.html !== 'string' || x.html.length < 2000) return x;
    const h = (k + '_h' + i + '_' + x.html.length).slice(0, 240); H[h] = x.html;
    const y = Object.assign({}, x); delete y.html; y.__h = h; return y; });
  const j = JSON.stringify(s);
  if (j.length >= 95000 || Object.keys(H).some(h => H[h].length >= 95000)) return false;
  if (Object.keys(H).length) c.putAll(H, PC3_SEG);
  c.put(k, j, PC3_SEG);
  return true;
}

function pc3Get_(c, k) {
  const j = c.get(k); if (!j) return null;
  const r = JSON.parse(j), hk = r.filter(x => x && x.__h).map(x => x.__h), H = hk.length ? c.getAll(hk) : {};
  if (!hk.every(h => H[h] != null)) return null;
  return r.map(x => { if (!x || !x.__h) return x; const y = Object.assign({}, x); y.html = H[x.__h]; delete y.__h; return y; });
}

/** Cada 5 min desde revisarNotificaciones: solo trabaja si cambió algo o pasaron 3 horas */
function pc3Precalcular_() {
  const ahora = new Date(), h = Number(Utilities.formatDate(ahora, TZ, 'H'));
  const hue = sh => { if (!sh) return ''; return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify(sh.getDataRange().getDisplayValues()))).slice(0, 12); };
  const ver = [hoy_(), h >= 6 ? Math.floor(h / 3) : 'noche', hue(polHojas_().getSheetByName(POL_HOJA)), hue(ss_().getSheetByName(GUIAS_HOJA))].join('|');
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('pc3_ver') === ver) return;
  const c = CacheService.getScriptCache();
  const tiendas = filas_(ss_().getSheetByName('Tiendas')).filter(r => String(r[1]).toLowerCase().indexOf('s') === 0).map(r => r[0]);
  tiendas.forEach(t => {
    try { pc3Put_(c, pc3Clave_('pol', t), politicasTienda_(t)); } catch (e) { console.warn('pc3 pol ' + t + ': ' + e.message); }
    try { pc3Put_(c, pc3Clave_('gui', t), guiasTienda_(t)); } catch (e) { console.warn('pc3 gui ' + t + ': ' + e.message); }
  });
  props.setProperty('pc3_ver', ver);
}
