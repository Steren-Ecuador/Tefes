#!/usr/bin/env python3
"""rb1 (Diego 10-nov): borrar una revisión de inventario ya guardada. Botón "Borrar revisión" (solo si hay una) que agrega
en MueCorrecciones una fila con decisión "Revisión anulada"; como manda la última fila, el producto vuelve a quedar sin revisar
(y deja de estar pendiente para el próximo conteo). Cancelar sigue siendo solo cerrar sin guardar.
Uso: python3 aplicar_rb1.py <admin.html|Panel.html>. Idempotente."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* rb1 */' in s: print('ya aplicado', p); sys.exit(0)
def rep(a, b):
    global s
    c = s.count(a)
    if c != 1: sys.exit('ancla %r aparece %d veces en %s' % (a[:70], c, p))
    s = s.replace(a, b)
rep("""  const m = {}; ((st.mue && st.mue.co) || []).slice(1).forEach(r => { if (r[1] === sem && r[2] === tienda && r[3]) m[sinApo(r[3])] = r; }); return m;""",
    """  const m = {}; ((st.mue && st.mue.co) || []).slice(1).forEach(r => { if (r[1] === sem && r[2] === tienda && r[3]) m[sinApo(r[3])] = r; });
  Object.keys(m).forEach(k => { if (m[k][10] === IV_ANUL) delete m[k]; });   /* rb1 */ return m;""")
rep("""<button class="btn" id="ivCancel">Cancelar</button></div>
  </div>`;""", """<button class="btn" id="ivCancel">Cancelar</button>${o.cr ? '<button class="btn" id="ivBorrar" style="margin-left:auto;color:#b91c1c">Borrar revisión</button>' : ''}</div>
  </div>`;""")
rep("""  $('#ivCancel').onclick = () => { ui.abierto = null; invPintar(); };
  $('#ivGuardar').onclick""", """  $('#ivCancel').onclick = () => { ui.abierto = null; invPintar(); };
  const bb = $('#ivBorrar');   /* rb1 */
  if (bb) bb.onclick = async () => {
    if (!confirm('¿Borrar tu revisión de ' + o.cod + '? El producto vuelve a quedar sin revisar.')) return;
    bb.disabled = true; bb.textContent = 'Borrando…';
    const fila = [stamp(), ui.sem, ui.tienda, "'" + o.cod, safe(o.desc), o.teo, o.contado == null ? '' : o.contado, '', '', '', IV_ANUL, 'Revisión borrada', 'Diego'];
    try {
      const co = await getRange('MueCorrecciones!A1:M', true, CLAVES), n = Math.max(co.length, 1) + 1;
      await setRange('MueCorrecciones!A' + n + ':M' + n, [fila], CLAVES);
      const local = fila.slice(); local[3] = o.cod; st.mue.co = (co.length ? co : [['Fecha']]).concat([local]);
      ui.abierto = null; toast('Revisión borrada'); invPintar(); renderInventario();
    } catch (e) { bb.disabled = false; bb.textContent = 'Borrar revisión'; const f = $('#ivFalta'); f.textContent = errorCopy(e); f.hidden = false; }
  };
  $('#ivGuardar').onclick""")
rep("const IV_PEND = 'Pendiente para el próximo inventario';", "const IV_PEND = 'Pendiente para el próximo inventario';\nconst IV_ANUL = 'Revisión anulada';   /* rb1 */")
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
