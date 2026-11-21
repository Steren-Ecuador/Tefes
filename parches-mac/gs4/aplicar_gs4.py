#!/usr/bin/env python3
"""gs4 (20-nov, solo admin): si Google no contesta al guardar un pendiente, antes de mostrar el error se espera 10 s
y se revisa una última vez la fila: si el cambio llegó (pasó con P00305 y P00366), se da por guardado.
Uso: python3 aplicar_gs4.py admin.html   (idempotente)"""
import sys
A = "      if (!pasajero || i >= 3) throw e;\n"
B = ("      if (!pasajero) throw e;\n"
     "      if (i >= 3) { if (btn) btn.textContent = 'Revisando si quedó guardado…'; await new Promise(ok => setTimeout(ok, 10000));   /* gs4 */\n"
     "        try { const v = await getRange1(`Pendientes!V${idx + 1}`, true); if (v[0] && String(v[0][0]) === s) return; } catch (_) {}\n"
     "        throw e; }\n")
for p in sys.argv[1:]:
    t = open(p, encoding='utf-8').read()
    if '/* gs4 */' in t: print('ya', p); continue
    if t.count(A) != 1: sys.exit('%s: ancla %d veces' % (p, t.count(A)))
    open(p, 'w', encoding='utf-8', newline='\n').write(t.replace(A, B)); print('ok', p)
