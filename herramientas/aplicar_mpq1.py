#!/usr/bin/env python3
"""mpq1 (22-nov-2026, hallado con "Ver como"): el panel pedía el menú del perfil con cvCtx.api, que antepone el ?p= (PTOKEN);
apiMenusPerfil(quien) recibía el token como nombre → {todo: true} → Financiero, Control y Call center veían TODO el menú.
Arreglo: pedirlo con google.script.run directo, solo con el nombre. Uso: python3 aplicar_mpq1.py Panel.html|panel.html ...  (idempotente)"""
import sys
A = "cvCtx.api('apiMenusPerfil', y.nombre).then(c => aplicar(c))"
B = "new Promise((ok, ko) => google.script.run.withSuccessHandler(ok).withFailureHandler(ko).apiMenusPerfil(y.nombre)).then(c => aplicar(c))   /* mpq1 */"
for r in sys.argv[1:]:
    s = open(r, encoding='utf-8').read()
    if '/* mpq1 */' in s: print('ya', r); continue
    if s.count(A) != 1: sys.exit(r + ': ancla no encontrada una vez')
    open(r, 'w', encoding='utf-8').write(s.replace(A, B)); print('ok', r)
