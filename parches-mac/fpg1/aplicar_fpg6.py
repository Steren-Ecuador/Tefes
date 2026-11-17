#!/usr/bin/env python3
"""fpg6 (Diego 17-nov): 1) el menú de la tienda dice "Formas de pago" en lugar de "Ventas";
2) el asistente pide el VENDEDOR (quién hizo la venta) en el paso 1, porque en el panel de la tienda puede registrar otra persona.
   El asesor es su propio vendedor. Columna W 'Vendedor' en la hoja; el panel lo muestra y lo exporta.
Se aplica DESPUÉS de fpg5. Uso: python3 aplicar_fpg6.py <archivo> ... (Index.html, tienda.html, asesor.html, Panel.html, panel.html, admin.html, prueba/servidor.js)
Necesita wizard_fpg6.js y FormasPago.gs en la misma carpeta."""
import sys, os
AQUI = os.path.dirname(os.path.abspath(__file__))
WIZ = open(os.path.join(AQUI, 'wizard_fpg6.js'), encoding='utf-8').read()
GS = open(os.path.join(AQUI, 'FormasPago.gs'), encoding='utf-8').read()
VAL = GS[GS.index('/* fpg5: VALIDACIÓN CONTABLE'):GS.index('\nfunction apiFPGRegistrar(')]
INI = '/* fpg5 (Diego 16-nov'

def entre(s, a, b, nuevo):
    i = s.index(a); j = s.index(b, i); return s[:i] + nuevo + s[j:]

def rep(s, R, q):
    for a, n in R:
        if n in s: continue          # ya aplicado
        assert s.count(a) == 1, q + ': ' + a[:60]; s = s.replace(a, n)
    return s

def tienda(s):
    s = entre(s, INI, 'function fpgFormulario(){', WIZ)
    R = [('<path d="M3 6h18v12H3zM3 10h18M7 15h4"/></svg>Ventas</button>', '<path d="M3 6h18v12H3zM3 10h18M7 15h4"/></svg>Formas de pago</button>'),
         ("pago: 'Ventas · Formas de pago'", "pago: 'Formas de pago'"),
         ('"sub": "Ventas · registrar', '"sub": "Menú Formas de pago · registrar'),
         ('{"id": "ventas", "nombre": "Ventas", "vistas": ["pago"]}', '{"id": "ventas", "nombre": "Formas de pago", "vistas": ["pago"]}'),
         ("' · registró ' + esc(x.registroVer || x.registro) + ' el '", "(x.vendedor ? ' · vendió ' + esc(x.vendedorVer || x.vendedor) : '') + ' · registró ' + esc(x.registroVer || x.registro) + ' el '")]
    if '<button data-v="pago">Ventas</button>' in s: R[0] = ('<button data-v="pago">Ventas</button>', '<button data-v="pago">Formas de pago</button>')
    return rep(s, R, 'tienda')

def asesor(s):
    return entre(s, INI, 'function formPago(){', WIZ)

def panel(s):
    R = [("'Total factura', 'Registró', 'Desde',", "'Total factura', 'Vendedor', 'Registró', 'Desde',"),
         ("x.valorFac ? n2(x.valorFac) : '', x.registroVer || x.registro, x.desde,", "x.valorFac ? n2(x.valorFac) : '', x.vendedorVer || x.vendedor || '', x.registroVer || x.registro, x.desde,"),
         ('<th class="c-reg">Registró</th>', '<th class="c-reg">Vendedor</th>'),
         ("<td class=\"c-reg\">' + e(x.registroVer || x.registro) + '<small>' + e(x.desde)",
          "<td class=\"c-reg\">' + e(x.vendedorVer || x.vendedor || x.registroVer || x.registro) + (x.vendedor && x.vendedor !== x.registro ? '<small>registró ' + e(x.registroVer || x.registro) + '</small>' : '') + '<small>' + e(x.desde)")]
    return rep(s, R, 'panel')

def prueba(s):
    R = [("'Banco', 'Fecha factura'];", "'Banco', 'Fecha factura', 'Vendedor'];"),
         ("DB.escribir('Formas de pago!A1:V1', [FPG_CAB]);", "DB.escribir('Formas de pago!A1:W1', [FPG_CAB]);"),
         ("fechaFac: S(r[21])}; }", "fechaFac: S(r[21]), vendedor: S(r[22]), vendedorVer: S(r[22])}; }"),
         ("while (f.length < 22) f.push(''); DB.escribir('Formas de pago!A' + (i + 1) + ':V' + (i + 1), [f]);", "while (f.length < 23) f.push(''); DB.escribir('Formas de pago!A' + (i + 1) + ':W' + (i + 1), [f]);"),
         ("v.otra, v.banco, v.fechaFac];", "v.otra, v.banco, v.fechaFac, v.vendedor];"),
         ("    var v = fpgValidar_(d, t, L.slice(1).map(fpObj), DB.isoDe(dd), fpDe(t));", "    if (d.desde === 'Asesor') d.vendedor = d.registro;\n    var v = fpgValidar_(d, t, L.slice(1).map(fpObj), DB.isoDe(dd), fpDe(t));")]
    s = rep(s, R, 'prueba')
    return entre(s, '/* fpg5: VALIDACIÓN CONTABLE', '\n  API.apiFPGRegistrar = function (tok, d) {', VAL)

for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read(); b = os.path.basename(p)
    if b == 'servidor.js': s = prueba(s)
    else:
        if 'function fpgFormulario(){' in s: s = tienda(s)
        elif 'function formPago(){' in s and INI in s: s = asesor(s)
        if "'Total factura', 'Registró', 'Desde'," in s or "'Total factura', 'Vendedor', 'Registró'" in s: s = panel(s)
    open(p, 'w', encoding='utf-8').write(s); print('ok', p)
