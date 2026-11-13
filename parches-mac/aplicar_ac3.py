#!/usr/bin/env python3
"""ac3 (13-nov): el panel de asesores abre al instante con los datos de la última visita
y se actualiza en segundo plano. Uso: python3 aplicar_ac3.py <asesor.html>"""
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
if '/* ac3 */' in s:
    print('ac3 ya aplicado'); sys.exit(0)

A1 = """  const yo = leerYo(); cargando('Cargando tu panel…'); const t0 = Date.now();   /* ca1 */
  llamar('apiAsesor', TOKEN, yo).then(d => { try {   /* de1 */"""
B1 = """  const yo = leerYo(); const t0 = Date.now();   /* ca1 */
  const CK = 'tefes_asesor_datos_' + TOKEN + '_' + slug(yo); let previo = null;   /* ac3 */
  try { const c = JSON.parse(localStorage.getItem(CK) || 'null'); if (yo && c && c.d && c.d.yo && c.d.yo.nombre === yo && Date.now() - c.t < 2 * 864e5) previo = c; } catch (e) {}
  if (previo) { try { pintarAs(previo.d, yo); } catch (e) { previo = null; } }
  if (!previo) cargando('Cargando tu panel…');
  llamar('apiAsesor', TOKEN, yo).then(d => { try {   /* de1 */"""

A2 = """      llamar('apiRegistroTienda', TOKEN, SES, DISP, [{ev: 'Carga', det: 'asesor · datos ' + String(s).replace('.', ',') + ' s · ' + DISP, seg: s, t: Date.now(), n: 2}]).catch(() => {}); }
    KEY = 'tefes_asesor_v1_' + slug(yo); cargarE(); aplicar(d);"""
B2 = """      llamar('apiRegistroTienda', TOKEN, SES, DISP, [{ev: 'Carga', det: 'asesor · datos ' + String(s).replace('.', ',') + ' s · ' + DISP + (previo ? ' · con datos guardados' : ''), seg: s, t: Date.now(), n: 2}]).catch(() => {}); }
    try { localStorage.setItem(CK, JSON.stringify({t: Date.now(), d: d})); } catch (e) {}   /* ac3 */
    if (!previo || JSON.stringify(previo.d) !== JSON.stringify(d)) { const y = window.scrollY; pintarAs(d, yo); if (previo) window.scrollTo(0, y); }
    llamar('apiVFLista', TOKEN).then(L => { E.futuras = (L || []).filter(x => x.asesor === YO.nombre).map(vfLocal); render(); }, () => {});
  } catch (e) { guardarYo(''); try { localStorage.removeItem(CK); } catch (e2) {} cargando('No se pudo abrir tu panel (' + (e && e.message || e) + '). Vuelve a abrir tu enlace; si sigue, avísale a tu gerente.'); } }, e => { if (!previo) cargando(e.message); });   /* de1 */
}
/* ac3: pinta el panel con los datos d (de la última visita o recién llegados); lo de una sola vez va con __ac3 */
function pintarAs(d, yo){
    KEY = 'tefes_asesor_v1_' + slug(yo); cargarE(); aplicar(d);"""

A3 = """    const v = Q.get('v'); if (v && SECCIONES.some(x => x[0] === v)) setTimeout(() => ir(v), 50);
    llamar('apiVFLista', TOKEN).then(L => { E.futuras = (L || []).filter(x => x.asesor === YO.nombre).map(vfLocal); render(); }, () => {});
  } catch (e) { guardarYo(''); cargando('No se pudo abrir tu panel (' + (e && e.message || e) + '). Vuelve a abrir tu enlace; si sigue, avísale a tu gerente.'); } }, e => cargando(e.message));   /* de1 */
}"""
B3 = """    const v = Q.get('v'); if (v && SECCIONES.some(x => x[0] === v)) setTimeout(() => ir(v), 50);
}"""

A4 = """    render();
    if (!E.perfil || !E.perfil.foto) bienvenida(); else setTimeout(pfFestejarSolas, 400);   /* pf2 */
    const v = Q.get('v');"""
B4 = """    render();
    if (window.__ac3) return; window.__ac3 = 1;   /* ac3: bienvenida y salto a sección solo la primera vez */
    if (!E.perfil || !E.perfil.foto) bienvenida(); else setTimeout(pfFestejarSolas, 400);   /* pf2 */
    const v = Q.get('v');"""

# A2 contiene el inicio de pintarAs; el bloque entre A2 y A3 (cuerpo) queda dentro de pintarAs
for a in (A1, A2, A3, A4):
    n = s.count(a)
    if n != 1:
        sys.exit('ancla encontrada %d veces: %r' % (n, a[:80]))
# A3 debe ir antes de reemplazar A4 (A4 está dentro de A3? no: A4 termina donde empieza A3)
s = s.replace(A3, B3).replace(A4, B4).replace(A2, B2).replace(A1, B1)
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ac3 aplicado')
