#!/usr/bin/env python3
"""bx6 (20-nov, Diego): el detalle del pendiente siempre a pantalla completa con ← (antes, al escribir un comentario se reabría a un lado).
Requiere bx4. Pega bx6.html antes del último </body>. Uso: python3 aplicar_bx6.py admin.html|Panel.html  (idempotente)"""
import os, sys
M = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bx6.html'), encoding='utf-8').read()
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '/* bx6' in s: print('ya', p); continue
    if '/* bx4' not in s: sys.exit(p + ': falta bx4')
    i = s.rfind('</body>'); s = s[:i] + M + s[i:]
    open(p, 'w', encoding='utf-8', newline='\n').write(s); print('ok', p)
