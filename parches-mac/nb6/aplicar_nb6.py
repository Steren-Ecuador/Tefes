#!/usr/bin/env python3
"""nb6 (21-nov, Diego): en la app de tienda (Index.html / tienda.html) la barra de abajo del celular tenía 6 botones en 5 columnas:
Formas de pago salía antes de Hoy y Cómo trabajamos bajaba a una segunda fila. Ahora: 6 columnas y orden Hoy, Formas de pago, Pendientes, Supervisar, Inventario, Cómo trabajamos.
Pega nb6.html antes del último </body>. Uso: python3 aplicar_nb6.py Index.html|tienda.html  (idempotente)"""
import os, sys
M = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nb6.html'), encoding='utf-8').read()
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '/* nb6' in s: print('ya', p); continue
    i = s.rfind('</body>')
    if i < 0: sys.exit(p + ': sin </body>')
    s = s[:i] + M + s[i:]; open(p, 'w', encoding='utf-8', newline='\n').write(s); print('ok', p)
