#!/usr/bin/env python3
"""mx1 (Diego 9-nov): Mercadería sin Inventario EXTRA (y sin Perchas en el admin). Uso: python3 aplicar_mx1.py <archivo>. Idempotente."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* mx1 */' in s: print('ya aplicado', p); sys.exit(0)
def rep(a, b, opc=False):
    global s
    c = s.count(a)
    if c == 0 and opc: return
    if c != 1: sys.exit('ancla %r aparece %d veces en %s' % (a[:70], c, p))
    s = s.replace(a, b)
rep('["inventario", "top", "Inventario Top 50"], ["inventario", "extra", "Inventario EXTRA"], ', '["inventario", "top", "Inventario Top 50"], ')
rep(', ["perchas", "", "Perchas"]]', ']', opc=True)
rep('"vistas": ["inventario", "transferencias", "perchas"]}', '"vistas": ["inventario", "transferencias"]}', opc=True)
css = '<style>/* mx1 */#tabs button[data-v="perchas"]{display:none!important}</style>\n'
i = s.rfind('</body>'); s = s[:i] + css + s[i:]
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
