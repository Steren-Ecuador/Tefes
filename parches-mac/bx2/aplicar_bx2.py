#!/usr/bin/env python3
"""bx2 (20-nov, Diego): "Todos los pendientes" pasa de tablero tipo Asana a bandeja tipo correo:
carpetas Por validar / Abiertos / Vencidos / Cerrados / Todos, lo más reciente arriba, ✓ Validar rápido o abrir el pendiente.
Uso: python3 aplicar_bx2.py admin.html|Panel.html [...]   (idempotente)"""
import os, sys
M = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bx2.html'), encoding='utf-8').read()
A = "  if (st.vista === 'tablero') {   // filtro"
B = "  if (st.vista === 'tablero' && window.bx2Pend) return bx2Pend(base, hoy, E, typeof chM === 'string' ? chM : '', typeof bindMios === 'function' ? bindMios : null);   /* bx2 */\n" + A
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '/* bx2 */' in s: print('ya', p); continue
    if s.count(A) != 1 or '</body>' not in s: sys.exit('%s: ancla %d' % (p, s.count(A)))
    s = s.replace(A, B); i = s.rfind('</body>'); s = s[:i] + M + s[i:]   # antes del último </body>
    open(p, 'w', encoding='utf-8', newline='\n').write(s); print('ok', p)
