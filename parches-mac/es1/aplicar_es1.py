#!/usr/bin/env python3
"""es1 (19-nov, Diego): decisión nueva en la revisión de diferencias del muestreo: "Sistema tiene error en stock".
No se descuenta al personal y en el informe sale aparte como lista para ajustar el stock en el ERP.
Uso: python3 aplicar_es1.py admin.html|Panel.html [...]   (idempotente)"""
import sys
E = "'Sistema tiene error en stock'"
R = [
  ("'Sobrante cargar a la tienda', 'Pendiente para el próximo inventario', 'Sigue en revisión'];",
   "'Sobrante cargar a la tienda', " + E + ", 'Pendiente para el próximo inventario', 'Sigue en revisión'];   /* es1 */"),
  ("const INF_NO_DESC = ['Ajustar en el sistema', ", "const INF_NO_DESC = [" + E + ", 'Ajustar en el sistema', "),
  ('<p class="small faint" style="margin:0">Marcado = se descuenta al personal.',
   "${(() => { const e = items.filter(x => x.dec === " + E + "); return e.length ? `<div class=\"banner\">Para ajustar el stock en el ERP (no se descuentan): ${e.map(x => esc(x.cod) + ' ' + ivSig(x.dif)).join(' · ')}</div>` : ''; })()}"
   '<p class="small faint" style="margin:0">Marcado = se descuenta al personal.'),
]
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '/* es1 */' in s: print('ya', p); continue
    for a, b in R:
        if s.count(a) != 1: sys.exit('%s: ancla %d veces: %s' % (p, s.count(a), a[:50]))
    for a, b in R: s = s.replace(a, b)
    open(p, 'w', encoding='utf-8', newline='\n').write(s); print('ok', p)
