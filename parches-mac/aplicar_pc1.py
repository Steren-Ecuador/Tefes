#!/usr/bin/env python3
"""pc1 (13-nov): Políticas y Guías de la tienda en caché del servidor (10 min).
La clave lleva el número de filas de la hoja de lecturas, así que cuando alguien
aprueba o confirma una lectura la caché se renueva sola. Los textos HTML largos
van en claves aparte para no pasar el límite de 100 KB por entrada.
Uso: python3 aplicar_pc1.py <proyecto_clasp>/Tiendas.gs"""
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
if '/* pc1 */' in s:
    print('pc1 ya aplicado'); sys.exit(0)
R = [("d.politicas = medir('politicas', () => politicasTienda_(tk), []);",
      "d.politicas = medir('politicas', () => pc1Leer_('pol', tk, () => politicasTienda_(tk)), []);   /* pc1 */"),
     ("d.guias = medir('guias', () => guiasTienda_(tk), []);",
      "d.guias = medir('guias', () => pc1Leer_('gui', tk, () => guiasTienda_(tk)), []);   /* pc1 */")]
for a, b in R:
    n = s.count(a)
    if n not in (1, 2): sys.exit('ancla encontrada %d veces: %s' % (n, a))  # apiInitTienda y apiInitTiendaParte
    s = s.replace(a, b)
s = s.rstrip('\n') + r"""

/** pc1: Políticas/Guías de la tienda en caché 10 min; la clave cambia cuando se agrega una lectura */
function pc1Leer_(q, tk, f) {   /* pc1 */
  const c = CacheService.getScriptCache();
  let v = 0;
  try { const sh = q === 'pol' ? polHojas_().getSheetByName(POL_LECT) : ss_().getSheetByName(GUIAS_LECT); v = sh ? sh.getLastRow() : 0; } catch (err) { return f(); }
  const k = ('pc1_' + q + '_' + tk + '_' + v).slice(0, 240);
  try {
    const j = c.get(k);
    if (j) {
      const r = JSON.parse(j), hk = r.filter(x => x && x.__h).map(x => x.__h), H = hk.length ? c.getAll(hk) : {};
      if (hk.every(h => H[h] != null)) return r.map(x => { if (!x || !x.__h) return x; const y = Object.assign({}, x); y.html = H[x.__h]; delete y.__h; return y; });
    }
  } catch (err) {}
  const r = f();
  try {
    const H = {}, s = (r || []).map(x => {
      if (!x || typeof x.html !== 'string' || x.html.length < 2000) return x;
      const h = ('pc1_h_' + q + '_' + x.id + '_' + x.html.length).slice(0, 240); H[h] = x.html;
      const y = Object.assign({}, x); delete y.html; y.__h = h; return y; });
    const j = JSON.stringify(s);
    if (Object.keys(H).every(h => H[h].length < 95000) && j.length < 95000) { if (Object.keys(H).length) c.putAll(H, 900); c.put(k, j, 600); }
  } catch (err) {}
  return r;
}
"""
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('pc1 aplicado')
