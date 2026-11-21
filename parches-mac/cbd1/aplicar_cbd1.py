#!/usr/bin/env python3
"""cbd1 (20-nov, solo admin): 'Documentos de cobro' se lee aparte con reintentos; si no se pudo leer, Inventario no marca
"Falta la factura" ni atraso (decía eso de Portal, Scala, Tumbaco y Mall Jardín S43, que estaban cerrados). Uso: python3 aplicar_cbd1.py admin.html"""
import sys
R = [("getRange(CBD_TAB + '!A1:O', true, CLAVES).catch(() => st.cbd || [])",
      "(async () => { for (let k = 0; ; k++) { try { const v = await getRange1(CBD_TAB + '!A1:O', true, CLAVES); st.cbdOk = true; return v; } catch (e) { if (k >= 2) { st.cbdOk = false; return st.cbd || []; } await new Promise(o => setTimeout(o, [2000, 6000][k])); } } })() /* cbd1 */"),
     ("  st.cbLeyendo = false; st.cbT = Date.now(); cbPintar();",
      "  st.cbLeyendo = false; st.cbT = Date.now(); if (st.cbdOk === false && !st.cbdReint) { st.cbdReint = setTimeout(() => { st.cbdReint = 0; cbLeer(true); }, 20000); }   /* cbd1 */\n  cbPintar();"),
     ("    else if (i === 4) { plazo = fInf",
      "    else if (i === 4 && !st.cbdOk && !x.manual) { plazo = ''; falta = 'Revisando la factura y el acta en la hoja…'; quien = 'Tienda'; }   /* cbd1 */\n    else if (i === 4) { plazo = fInf")]
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '/* cbd1 */' in s: print('ya', p); continue
    for a, b in R:
        if s.count(a) != 1: sys.exit('%s: ancla %d: %s' % (p, s.count(a), a[:40]))
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8', newline='\n').write(s); print('ok', p)
