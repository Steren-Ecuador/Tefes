#!/usr/bin/env python3
"""pt4 (Diego 10-nov): un producto puede quedar "Pendiente para el próximo inventario" en 3 inventarios como máximo
(antes: 4 semanas). Cuenta los inventarios anteriores seguidos con esa decisión en la misma tienda; al llegar a 3 la
opción desaparece y hay que decidir. Al elegirla muestra "Pendiente N de 3: no se descuenta y va al conteo de la próxima semana".
Uso: python3 aplicar_pt4.py <admin.html|Panel.html>. Idempotente."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* pt4 */' in s: print('ya aplicado', p); sys.exit(0)
def rep(a, b):
    global s
    c = s.count(a)
    if c != 1: sys.exit('ancla %r aparece %d veces en %s' % (a[:70], c, p))
    s = s.replace(a, b)
rep("""  let primera = '';
  Object.keys(porSem).sort().reverse().every(s => porSem[s] === IV_PEND ? (primera = s, true) : false);
  return !!primera && n(ui.sem) - n(primera) >= 4;
}""", """  /* pt4 */ let k = 0;
  Object.keys(porSem).sort().reverse().every(s => porSem[s] === IV_PEND ? (k++, true) : false);
  return k >= 3;
}
function ivPendVeces(o){   /* pt4: en cuántos inventarios seguidos ya estuvo pendiente (sin contar el actual) */
  const ui = st.ivUI, porSem = {};
  ((st.mue && st.mue.co) || []).slice(1).forEach(r => { if (r[2] === ui.tienda && sinApo(r[3]) === o.cod && r[1] < ui.sem) porSem[r[1]] = r[10]; });
  let k = 0; Object.keys(porSem).sort().reverse().every(s => porSem[s] === IV_PEND ? (k++, true) : false); return k;
}""")
rep("""    ${ivPendTope(o) ? '<p class="small faint" style="margin:4px 0 0">Ya lleva 4 semanas pendiente: hay que decidir.</p>' : ''}""",
    """    ${ivPendTope(o) ? '<p class="small faint" style="margin:4px 0 0">Ya estuvo pendiente en 3 inventarios: hay que decidir.</p>' : '<p class="small faint" style="margin:4px 0 0">Pendiente: no se descuenta en este inventario y va al conteo de la próxima semana' + (ivPendVeces(o) ? ' (ya estuvo pendiente en ' + ivPendVeces(o) + (ivPendVeces(o) === 1 ? ' inventario' : ' inventarios') + '; máximo 3)' : ' (máximo 3 inventarios)') + '.</p>'}""")
rep("/* pt2: un producto no queda pendiente más de 4 semanas (Diego 2026-10-31) */", "/* pt2 → pt4: un producto no queda pendiente en más de 3 inventarios (Diego 2026-11-10) */")
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
