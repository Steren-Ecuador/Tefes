#!/usr/bin/env python3
"""fpg7 (Diego 17-nov): si un perfil solo ve Formas de pago dentro de Ventas (Financiero), el menú dice "Formas de pago" y no "Ventas".
Uso: python3 aplicar_fpg7.py Panel.html|panel.html ..."""
import sys
A = "    abajo(); tabs.dataset.mn = String(Date.now());\n  }"
N = ("    try { const T = ((window.TEM && TEM.temas) || []).find(t => t.id === 'ventas');   // fpg7: si de Ventas solo queda Formas de pago, el tema se llama así\n"
     "      if (T && vivas.formaspago && T.vistas.filter(v => vivas[v] || !todas[v]).length === 1) T.nombre = 'Formas de pago'; } catch (e) {}\n" + A)
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '// fpg7:' not in s:
        assert s.count(A) == 1, p; s = s.replace(A, N)
    open(p, 'w', encoding='utf-8').write(s); print('ok', p)
