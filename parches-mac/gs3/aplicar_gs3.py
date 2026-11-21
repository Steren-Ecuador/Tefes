#!/usr/bin/env python3
"""gs3 (20-nov, solo admin): antes de guardar un pendiente ya no se lee toda la hoja Pendientes (A1:W, cientos de filas con su historial),
sino la columna de IDs y la fila del pendiente. Menos datos = Google responde a tiempo.
Uso: python3 aplicar_gs3.py admin.html   (idempotente; requiere gs2)"""
import sys
A = "filas = await getRange('Pendientes!A1:W', true); break;"
B = ("filas = await (async () => { const ids = await getRange1('Pendientes!A1:A', true), ix = ids.findIndex(x => x[0] === id); if (ix < 1) return ids; "
     "const f = await getRange1('Pendientes!A' + (ix + 1) + ':W' + (ix + 1), true); return ids.map((x, k) => k === ix ? (f[0] || x) : x); })(); break;   /* gs3 */")
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '/* gs3 */' in s: print('ya', p); continue
    if s.count(A) != 1: sys.exit('%s: ancla %d veces' % (p, s.count(A)))
    open(p, 'w', encoding='utf-8', newline='\n').write(s.replace(A, B)); print('ok', p)
