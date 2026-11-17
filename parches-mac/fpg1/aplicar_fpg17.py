#!/usr/bin/env python3
"""fpg17 (Diego 17-nov: "si dice Excel debe ser en formato Excel"): Exportar a Excel baja un .xlsx real
(xlsx_fpg17.js, sin librerías) en panel, Panel.html y admin. Uso: python3 aplicar_fpg17.py archivo...  Idempotente."""
import sys, os, re
FN = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'xlsx_fpg17.js'), encoding='utf-8').read()
NUEVO = ("    const blob = xlsxBlob(nombre.slice(0, 31), filas), arch = nombre.replace(/[\\\\/:*?\"<>|]/g, '-') + '.xlsx';   // fpg17\n"
         "    (async () => { try { const dl = await (window.claude && window.claude.use ? window.claude.use('downloads') : null); if (!dl) throw 0; await dl.save({filename: arch, data: blob}); }\n"
         "      catch (e) { if (e && e.code === 'declined') return; const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = arch; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); } })();\n")
for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf-8').read()
    if 'fpg17' in s: print(ruta, 'ya tenía fpg17'); continue
    i = s.find('  function csv(nombre, filas){\n')
    if i < 0 or s.count('  function csv(nombre, filas){\n') != 1: sys.exit(ruta + ': no encontré csv()')
    j = s.find("    C().api('apiFPGExporto'", i)
    k = s.find('\n', i) + 1
    if j < 0 or j - i > 3000: sys.exit(ruta + ': no encontré el final de csv()')
    s = s[:i] + FN + s[i:k] + NUEVO + s[j:]
    open(ruta, 'w', encoding='utf-8').write(s); print(ruta, 'fpg17 aplicado')
