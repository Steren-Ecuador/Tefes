#!/usr/bin/env python3
"""Diego 2026-10-31: lo marcado "Pendiente para el próximo inventario" en la revisión entra solo en la
lista del próximo Muestreo Top 50 de esa tienda (al final, además de los 50, motivo "Pendiente del
inventario anterior"). Deja de entrar cuando el código ya estuvo en una lista posterior a esa revisión.
Uso: python3 aplicar_pendiente_top50.py Muestreo.gs   (idempotente)"""
import sys
R = [
("function muElegir_(semilla, ventas, stock, lpe, barras, yaContados) {\n  yaContados = yaContados || {};",
 "function muElegir_(semilla, ventas, stock, lpe, barras, yaContados, pendientes) {\n  yaContados = yaContados || {};"),
("elegidos.push(item(c, 'Al azar')); });\n  return elegidos;\n}",
 "elegidos.push(item(c, 'Al azar')); });\n  (pendientes || []).forEach(c => { if (!ya[c]) { ya[c] = true; elegidos.push(item(c, 'Pendiente del inventario anterior')); } });\n  return elegidos;\n}\n\n"
 "/** pt1: códigos que la revisión dejó \"Pendiente para el próximo inventario\" y que aún no volvieron a una lista */\n"
 "function muPendientes_(tienda, sem) {\n"
 "  const sh = SpreadsheetApp.openById(CLAVES_ID).getSheetByName('MueCorrecciones'); if (!sh) return [];\n"
 "  const ult = {}, listas = {};\n"
 "  sh.getDataRange().getValues().slice(1).forEach(r => { if (String(r[2]) === tienda) ult[String(r[3]).replace(/^'/, '').trim()] = r; });\n"
 "  muFilas_('MueLista').forEach(r => { if (r[ML.TIENDA] === tienda && r[ML.SEM] !== sem) { const c = String(r[ML.COD]).trim(); if (!listas[c] || r[ML.SEM] > listas[c]) listas[c] = r[ML.SEM]; } });\n"
 "  return Object.keys(ult).filter(c => String(ult[c][10]) === 'Pendiente para el próximo inventario' && String(ult[c][1]) < sem && !(listas[c] > String(ult[c][1])));\n"
 "}"),
("    const items = muElegir_(sem + '|' + tienda, ventas, stock, lpe, barras, yaContados);",
 "    const items = muElegir_(sem + '|' + tienda, ventas, stock, lpe, barras, yaContados, muPendientes_(tienda, sem));"),
]
for f in sys.argv[1:]:
    s = open(f, encoding='utf-8').read()
    if 'pt1:' in s: print(f, 'ya aplicado'); continue
    for a, b in R:
        n = s.count(a)
        if n != 1: sys.exit(f'{f}: ancla encontrada {n} veces: {a[:70]!r}')
        s = s.replace(a, b)
    open(f, 'w', encoding='utf-8').write(s); print(f, 'OK')
