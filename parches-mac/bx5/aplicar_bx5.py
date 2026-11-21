#!/usr/bin/env python3
"""bx5 (21-nov, Diego): "Todos los pendientes" va ARRIBA de "Tiendas: detalle de ventas y supervisión".
Intercambia los dos bloques dentro de la vista pendientes. Uso: python3 aplicar_bx5.py admin.html|Panel.html  (idempotente)"""
import re, sys
R = re.compile(r'(    <div>\n      <div class="sec-h"><h2>Tiendas: detalle de ventas y supervisión.*?\n    </div>\n)(    <section class="panel" id="explorer">.*?\n    </section>\n)', re.S)
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '<!-- bx5 -->' in s: print('ya', p); continue
    if len(R.findall(s)) != 1: sys.exit('%s: bloques %d' % (p, len(R.findall(s))))
    s = R.sub(lambda m: m.group(2).replace('id="explorer">', 'id="explorer"><!-- bx5 -->', 1) + m.group(1), s)
    open(p, 'w', encoding='utf-8', newline='\n').write(s); print('ok', p)
