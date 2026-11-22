#!/usr/bin/env python3
"""hs1 (22-nov-2026, Diego): Inicio > "Tabla de posiciones · Supervisión" muestra la tabla completa de Supervisión
(Mes, Verde/Ámbar/Rojo, Sin sup., Pendientes, Sección más baja, Pts, Últimas 6 semanas) en vez de la versión corta.
Copia lo que pinta pos1Html en #stores dentro de #hlSup. Uso: python3 aplicar_hs1.py admin.html|Panel.html|panel.html ...  (idempotente)"""
import sys
ANCLA = "document.querySelectorAll('#stores tr.click').forEach(tr => tr.onclick = () => detalleTienda(tr.dataset.t));"
JS = ANCLA + "\n  /* hs1 */ if ($('#hlSup') && $('#stores')) { $('#hlSup').innerHTML = $('#stores').innerHTML; $('#hlSup').querySelectorAll('tr.click').forEach(tr => tr.onclick = () => detalleTienda(tr.dataset.t)); }"
HINT_A = '<h2>Tabla de posiciones · Supervisión<span class="cfil"></span></h2><span class="hint">De mejor a peor puntaje.</span>'
HINT_B = '<h2>Tabla de posiciones · Supervisión<span class="cfil"></span></h2><span class="hint">Mejor puntaje del mes primero. Toca una tienda para ver su detalle.</span>'
DIV_A = '<div class="panel flush" id="hlSup">'
DIV_B = '<div class="panel flush" id="hlSup" style="overflow-x:auto">'
for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf-8').read()
    if '/* hs1 */' in s: print('ya', ruta); continue
    if s.count(ANCLA) != 1: sys.exit(ruta + ': ancla #stores no encontrada una sola vez')
    if 'function pos1Html(' not in s: sys.exit(ruta + ': falta pos1')
    s = s.replace(ANCLA, JS, 1)
    if HINT_A in s: s = s.replace(HINT_A, HINT_B, 1)
    if s.count(DIV_A) == 1: s = s.replace(DIV_A, DIV_B, 1)
    open(ruta, 'w', encoding='utf-8', newline='\n').write(s); print('ok', ruta)
