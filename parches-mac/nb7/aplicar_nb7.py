#!/usr/bin/env python3
"""nb7 (21-nov, Diego: "en lugar de Hoy pon Inicio como mi panel y todos así"): en la app de tienda el botón y el buscador dicen
"Inicio" en vez de "Hoy" (el panel admin, el de supervisores y el de asesores ya dicen Inicio). Uso: python3 aplicar_nb7.py Index.html|tienda.html (idempotente)"""
import sys
R = [('</svg>Hoy<span class="dot" id="bIni"', '</svg>Inicio<span class="dot" id="bIni"'),
     ('{"t": "Hoy", "v": "inicio"', '{"t": "Inicio", "v": "inicio"')]
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read(); n = 0
    for a, b in R:
        if b in s: continue
        if s.count(a) != 1: sys.exit('%s: ancla %d: %s' % (p, s.count(a), a))
        s = s.replace(a, b); n += 1
    open(p, 'w', encoding='utf-8', newline='\n').write(s); print('ok' if n else 'ya', p)
