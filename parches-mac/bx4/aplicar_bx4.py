#!/usr/bin/env python3
"""bx4 (20-nov, Diego "quiero así como Gmail", también en el celular): reemplaza la bandeja bx2 de Todos los pendientes
por una tipo Gmail (carpetas a la izquierda, filas de una línea, ✓ Validar al pasar el mouse, abrir a pantalla completa).
Requiere bx2 (el gancho en renderPend). Pega bx4.html antes del último </body>. Uso: python3 aplicar_bx4.py admin.html|Panel.html  (idempotente)"""
import os, sys
M = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bx4.html'), encoding='utf-8').read()
# El gancho de bx2 ahora pasa todo lo que la bandeja necesita (en Panel.html viven dentro de una función cerrada)
H0 = "bindMios === 'function' ? bindMios : null);   /* bx2 */"
H1 = "bindMios === 'function' ? bindMios : null, {st, $, dias, fmtF, esc, ABIERTOS, detalle, guardarEstado, renderPend, puede: typeof puede === 'function' ? puede : null});   /* bx2 */ /* bx4 */"
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '/* bx4' in s: print('ya', p); continue
    if '/* bx2 */' not in s: sys.exit(p + ': falta bx2')
    if s.count(H0) != 1: sys.exit(p + ': gancho bx2 %d' % s.count(H0))
    s = s.replace(H0, H1)
    i = s.rfind('</body>'); s = s[:i] + M + s[i:]
    open(p, 'w', encoding='utf-8', newline='\n').write(s); print('ok', p)
