#!/usr/bin/env python3
"""pt2 (Diego 2026-10-31): un producto no queda "Pendiente para el próximo inventario" más de 4 semanas.
Desde la 4ª semana la revisión ya no ofrece esa decisión y avisa "hay que decidir".
Va después de aplicar_revision_rapida.py. Uso: python3 aplicar_tope_pendiente.py Panel.html  (idempotente)"""
import sys
R = [
("const ivDecN = d => d === 'Faltante a cargo de la tienda' ? 'Faltante a cargo del personal' : d;   // nombre anterior de la decisión",
 "const ivDecN = d => d === 'Faltante a cargo de la tienda' ? 'Faltante a cargo del personal' : d;   // nombre anterior de la decisión\n"
 "/* pt2: un producto no queda pendiente más de 4 semanas (Diego 2026-10-31) */\n"
 "const IV_PEND = 'Pendiente para el próximo inventario';\n"
 "function ivPendTope(o){\n"
 "  const ui = st.ivUI, n = s => Number(String(s).slice(0, 4)) * 53 + Number(String(s).slice(6)) || 0, porSem = {};\n"
 "  ((st.mue && st.mue.co) || []).slice(1).forEach(r => { if (r[2] === ui.tienda && sinApo(r[3]) === o.cod && r[1] < ui.sem) porSem[r[1]] = r[10]; });\n"
 "  let primera = '';\n"
 "  Object.keys(porSem).sort().reverse().every(s => porSem[s] === IV_PEND ? (primera = s, true) : false);\n"
 "  return !!primera && n(ui.sem) - n(primera) >= 4;\n"
 "}"),
("${IV_DEC.filter(d => !['Ajustar en el sistema', 'Sigue en revisión'].includes(d) || cr[10] === d)",
 "${IV_DEC.filter(d => !['Ajustar en el sistema', 'Sigue en revisión'].includes(d) && !(d === IV_PEND && ivPendTope(o)) || cr[10] === d)"),
("    <div class=\"fila\" id=\"ivVendBox\"",
 "    ${ivPendTope(o) ? '<p class=\"small faint\" style=\"margin:4px 0 0\">Ya lleva 4 semanas pendiente: hay que decidir.</p>' : ''}\n    <div class=\"fila\" id=\"ivVendBox\""),
]
for f in sys.argv[1:]:
    s = open(f, encoding='utf-8').read()
    if 'pt2:' in s: print(f, 'ya aplicado'); continue
    for a, b in R:
        n = s.count(a)
        if n != 1: sys.exit(f'{f}: ancla encontrada {n} veces: {a[:70]!r}')
        s = s.replace(a, b)
    open(f, 'w', encoding='utf-8').write(s); print(f, 'OK')
