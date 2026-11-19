#!/usr/bin/env python3
"""nav2 (19-nov): en pantallas anchas el menú principal pasa a una segunda línea si no cabe (antes se cortaba la última pestaña).
Pestañas un poco más juntas para que quepan en una línea. Uso: python3 aplicar_nav2.py archivo.html [...]   (idempotente)"""
import sys
A = '.tem-nav::-webkit-scrollbar{display:none}'
N = A + '\n@media (min-width:760px){.tem-nav{flex-wrap:wrap;overflow:visible}html .tem-nav button{padding:10px 9px 12px;font-size:14px}}   /* nav2 */'
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '/* nav2 */' in s: print('ya', p); continue
    if s.count(A) != 1: sys.exit('%s: ancla %d veces' % (p, s.count(A)))
    open(p, 'w', encoding='utf-8', newline='\n').write(s.replace(A, N)); print('ok', p)
