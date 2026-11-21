#!/usr/bin/env python3
"""fpg21 (Diego 20-nov noche): la app de la tienda cruza con el POS (Por registrar / Por revisar), número rojo en Formas de pago,
aviso en Hoy, registro rápido de un pendiente en una sola pantalla y corrección de factura desde la tienda (queda en la bitácora).
Uso: python3 aplicar_fpg21.py <proyecto_clasp>   o   python3 aplicar_fpg21.py tienda.html prueba/tienda.html   (idempotente)"""
import sys, os
AQUI = os.path.dirname(os.path.abspath(__file__))
leer = lambda n: open(os.path.join(AQUI, n), encoding='utf-8').read()
def cambiar(ruta, pares, marca, extra=None):
    s = open(ruta, encoding='utf-8').read()
    if marca in s:
        print(ruta, 'ya tenía fpg21'); return
    for a, b in pares:
        n = s.count(a)
        if n != 1: sys.exit(ruta + ': encontré ' + str(n) + ' veces: ' + a[:90])
        s = s.replace(a, b)
    if extra: s = extra(s)
    open(ruta, 'w', encoding='utf-8').write(s); print(ruta, 'fpg21 aplicado')
d = sys.argv[1]
HTML = [os.path.join(d, 'Index.html')]
if d.endswith('.html'):   # espejo GitHub: tienda.html y prueba/tienda.html (solo la parte de la app)
    HTML = sys.argv[1:]
else:
  # 1. servidor
  cambiar(os.path.join(d, 'FormasPago.gs'), [
  ("  return {formas: fpgFormasDe_(tienda, extras), extras: extras, hoy: hoy_(), prefijo: pre.sort((a, b) => pre.filter(y => y === b).length - pre.filter(y => y === a).length)[0] || '', lista: lista};",
   "  let pos = null; try { pos = fpgCruce_(tienda, lista); } catch (e) { console.error('fpg21 cruce: ' + e.message); }   // fpg21\n"
   "  return {formas: fpgFormasDe_(tienda, extras), extras: extras, hoy: hoy_(), prefijo: pre.sort((a, b) => pre.filter(y => y === b).length - pre.filter(y => y === a).length)[0] || '', lista: lista, pos: pos};"),
], 'fpg21 (Diego 20-nov noche)', lambda s: s.rstrip('\n') + '\n' + leer('fpg21.gs.txt'))
  cambiar(os.path.join(d, 'PortalApi.gs'), [
  ("  apiFPGExporto: (a) => apiFPGExporto(...a),   // fpg1\n", "  apiFPGExporto: (a) => apiFPGExporto(...a),   // fpg1\n  apiFPGCorregirTienda: (a) => apiFPGCorregirTienda(...a),   // fpg21\n"),
], 'apiFPGCorregirTienda')
# 2. app de la tienda
JS = leer('fpg21_cliente.js'); CSS = leer('fpg21.css')
for h in HTML: cambiar(h, [
  ("api('apiFPGLista').then(r => { FPGS.lista = (r && r.lista) || [];", "api('apiFPGLista').then(r => { FPGS.lista = (r && r.lista) || []; FPGS.pos = (r && r.pos) || null;"),
  ("    .finally(() => { FPGS.cargando = false; if (S.vista === 'pago') renderPago(); });", "    .finally(() => { FPGS.cargando = false; if (S.vista === 'pago') renderPago(); fpgMarca(); });   // fpg21"),
  ("  h += '<button class=\"btn block\" id=\"fpgNuevo\">'", "  h += fpgPosHtml();   // fpg21\n  h += '<button class=\"btn block\" id=\"fpgNuevo\">'"),
  ("  const n = $('#fpgNuevo'); if (n) n.onclick = fpgFormulario;", "  fpgPosEnlazar();   // fpg21\n  const n = $('#fpgNuevo'); if (n) n.onclick = fpgFormulario;"),
  ("  else renderSup();\n  setHH();\n}", "  else renderSup();\n  setHH(); fpgMarca();   // fpg21\n}"),
  ('<path d="M3 6h18v12H3zM3 10h18M7 15h4"/></svg>Formas de pago</button>', '<path d="M3 6h18v12H3zM3 10h18M7 15h4"/></svg>Formas de pago <span class="badge" id="bPago" hidden></span></button>'),
  ("function fpgFormulario(){   // fpg5", JS + "function fpgFormulario(){   // fpg5"),
  ("</head>", "<style>" + CSS + "</style>\n</head>"),
], '/* fpg21 */')
