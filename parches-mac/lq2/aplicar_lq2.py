#!/usr/bin/env python3
"""lq2 (23-nov-2026): cuando Google responde "service unavailable" a la lectura en lote,
el admin ya no la parte en ~25 lecturas sueltas al mismo tiempo (eso disparaba la cascada
de "Connector call failed"). Espera 3 s y reintenta el lote una vez; si vuelve a fallar,
devuelve el error para que la vista reintente sola.
Uso: python3 aplicar_lq2.py index.html"""
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
if 'lq2' in s:
    print('ya estaba lq2'); sys.exit(0)
a = "  const rangos = [...new Set(lote.map(i => i.range))];\n  if (rangos.length < 2) { lote.forEach(una); return; }\n  try {\n"
b = "  const rangos = [...new Set(lote.map(i => i.range))];\n  if (rangos.length < 2) { lote.forEach(una); return; }\n  lqLote(q, lote, rangos, una, 0);\n}\nasync function lqLote(q, lote, rangos, una, n){   /* lq2: reintento del lote ante una caída breve de Google */\n  try {\n"
assert s.count(a) == 1, 'no se encontró lqSalir'
s = s.replace(a, b)
c = "    if (c !== 'tool_error' && !LQ.sinLote || /quota|429|RESOURCE_EXHAUSTED|rate limit/i.test(txt)) lote.forEach(i => i.rej(e));"
d = ("    const pasajera = c === 'upstream_error' || c === 'server_unavailable' || /unavailable|503|timed? ?out|deadline/i.test(txt);\n"
     "    if (pasajera && !LQ.sinLote && n < 1) { setTimeout(() => lqLote(q, lote, rangos, una, n + 1), 3000); return; }\n"
     "    if (pasajera || c !== 'tool_error' && !LQ.sinLote || /quota|429|RESOURCE_EXHAUSTED|rate limit/i.test(txt)) lote.forEach(i => i.rej(e));")
assert s.count(c) == 1, 'no se encontró el catch'
s = s.replace(c, d)
open(p, 'w', encoding='utf-8').write(s)
print('ok lq2', p)
