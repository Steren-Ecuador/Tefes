#!/usr/bin/env python3
"""pt3 (Diego 2026-10-31): la pantalla de conteo le recuerda a la tienda los productos que quedaron
pendientes de la semana pasada (aviso arriba y ⏳ en la lista).
Uso: python3 aplicar_recordatorio_conteo.py Muestreo.gs MuestreoConteo.html [index.html del conteo externo]  (idempotente)"""
import sys
GS = [("desc: r[ML.DESC], grupo: r[ML.GRUPO],",
       "desc: r[ML.DESC], grupo: r[ML.GRUPO], pend: r[ML.MOT] === 'Pendiente del inventario anterior',")]
HTML = [
("  h += '<button class=\"btn grande\" id=\"bScan\">",
 "  /* pt3: recordatorio de lo pendiente de la semana pasada */\n"
 "  var pendS = d.items.filter(function (i) { return i.pend; });\n"
 "  if (pendS.length && !r2) h += '<div class=\"aviso warn\"><b>⏳ Pendiente de la semana pasada.</b> ' + (pendS.length === 1 ? 'Este producto quedó' : 'Estos ' + pendS.length + ' productos quedaron') +\n"
 "    ' pendiente' + (pendS.length === 1 ? '' : 's') + ' en el inventario anterior y se vuelve' + (pendS.length === 1 ? '' : 'n') + ' a contar: ' + pendS.map(function (i) { return esc(i.desc); }).join(', ') + '. Cuéntalos con cuidado.</div>';\n"
 "  h += '<button class=\"btn grande\" id=\"bScan\">"),
("<div class=\"d\"><b>' + esc(i.desc) + '</b><small>' + esc(i.cod)",
 "<div class=\"d\"><b>' + (i.pend ? '⏳ ' : '') + esc(i.desc) + '</b><small>' + esc(i.cod) + (i.pend ? ' · pendiente de la semana pasada' : '')"),
]
for f in sys.argv[1:]:
    s = open(f, encoding='utf-8').read()
    R = GS if f.endswith('.gs') else HTML
    if 'pend: r[ML.MOT]' in s or 'pt3:' in s: print(f, 'ya aplicado'); continue
    for a, b in R:
        n = s.count(a)
        if n != 1: sys.exit(f'{f}: ancla encontrada {n} veces: {a[:70]!r}')
        s = s.replace(a, b)
    open(f, 'w', encoding='utf-8').write(s); print(f, 'OK')
