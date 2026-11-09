#!/usr/bin/env python3
"""vs1 (Diego 9-nov): Ventas con sub-opciones: Flash | Explorar ventas | Garantías extendidas | Presupuesto por persona.
Uso: python3 aplicar_vs1.py <archivo.html>   (admin, panel del espejo o Panel.html). Idempotente."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* vs1 */' in s: print('ya aplicado', p); sys.exit(0)
def rep(a, b, opc=False):
    global s
    c = s.count(a)
    if c == 0 and opc: return
    if c != 1: sys.exit('ancla %r aparece %d veces en %s' % (a[:60], c, p))
    s = s.replace(a, b)
rep('"ventas": [["flash", "", "Flash de ventas"]]', '"ventas": [["flash", "fl", "Flash de ventas"], ["flash", "fd", "Explorar ventas"], ["flash", "gar", "Garantías extendidas"], ["flash", "pp", "Presupuesto por persona"]]')
# mp3 (solo donde existe)
rep("'flash|': 'ventas/flash', ", "'flash|fl': 'ventas/flash', 'flash|fd': 'ventas/explorar', 'flash|gar': 'ventas/garantias', 'flash|pp': 'ventas/presupuesto', ", opc=True)
V = '.view[data-view="flash"]'
css = ('<style>/* vs1 */'
  + V + '[data-sub="fl"]>#fdBody,' + V + '[data-sub="fl"]>#garBody,' + V + '[data-sub="fl"]>#ppBody,'
  + V + '[data-sub="fd"]>:not(#fdBody):not(.mn-chips),'
  + V + '[data-sub="gar"]>:not(#garBody):not(.mn-chips),'
  + V + '[data-sub="pp"]>:not(#ppBody):not(.mn-chips){display:none!important}'
  + V + '[data-sub="gar"]>#garBody:empty::before,' + V + '[data-sub="pp"]>#ppBody:empty::before{content:"Cargando…";color:var(--muted,#888);font-size:14px}'
  + '</style>\n')
i = s.rfind('</body>'); s = s[:i] + css + s[i:]
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
