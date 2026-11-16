#!/usr/bin/env python3
"""fpg2 (Diego 16-nov): lista definitiva de formas de pago (deUna, Transferencias, Shopping Dólares - Condado, MobiSol - Mall del Sol, Otra)
y campo obligatorio "¿Cuál?" cuando es Otra. Se aplica DESPUÉS de fpg1.
Uso: python3 aplicar_fpg2.py <archivo> [<archivo> ...]   (Index.html, tienda.html, asesor.html, Panel.html, panel.html, prueba/servidor.js)
FormasPago.gs se copia entero desde esta carpeta."""
import sys, os
VIEJA = "['Tarjeta de crédito', 'Tarjeta de débito', 'Transferencia', 'Steren Card', 'Shopping Dólares', 'Crédito directo', 'Cheque', 'Efectivo', 'Otra']"
NUEVA = "['deUna', 'Transferencias', 'Otra']"
TIENDA = [
  (VIEJA, NUEVA),
  ("F.map(m => '<option>' + esc(m) + '</option>').join('') + '</select>' +",
   "F.map(m => '<option>' + esc(m) + '</option>').join('') + '</select>' +\n    '<div id=\"fpgOtraW\" style=\"display:none\"><label class=\"f\">¿Cuál otra forma de pago?</label><input type=\"text\" id=\"fpgOtra\" maxlength=\"100\" autocomplete=\"off\" placeholder=\"Ej.: tarjeta de crédito\"></div>' +"),
  ("  $('#fpgNo').onclick = closeModal;", "  $('#fpgNo').onclick = closeModal;\n  $('#fpgForma').onchange = () => { $('#fpgOtraW').style.display = $('#fpgForma').value === 'Otra' ? '' : 'none'; };"),
  ("forma: $('#fpgForma').value,", "forma: $('#fpgForma').value, otra: $('#fpgOtra').value.trim(),"),
  ("!d.forma ? 'Elige la forma de pago.' : !d.pedido", "!d.forma ? 'Elige la forma de pago.' : d.forma === 'Otra' && d.otra.length < 3 ? 'Escribe cuál es la otra forma de pago.' : !d.pedido"),
  ("'vf-esp\">' + esc(x.forma))", "'vf-esp\">' + esc(x.forma + (x.otra ? ': ' + x.otra : '')))"),
]
ASESOR = [
  (VIEJA, NUEVA),
  ("F.map(x => '<option>' + esc(x) + '</option>').join('') + '</select>' +",
   "F.map(x => '<option>' + esc(x) + '</option>').join('') + '</select>' +\n    '<div id=\"pOW\" style=\"display:none\"><label class=\"f\">¿Cuál otra forma de pago?</label><input class=\"i\" id=\"pO\" maxlength=\"100\" autocomplete=\"off\" placeholder=\"Ej.: tarjeta de crédito\"></div>' +"),
  ("  $('#cx').onclick = cerrar;\n  $('#ok').onclick = () => {\n    const d = {factura: $('#pF')",
   "  $('#cx').onclick = cerrar;\n  $('#pP').onchange = () => { $('#pOW').style.display = $('#pP').value === 'Otra' ? '' : 'none'; };\n  $('#ok').onclick = () => {\n    const d = {factura: $('#pF')"),
  ("forma: $('#pP').value,", "forma: $('#pP').value, otra: $('#pO').value.trim(),"),
  ("!d.forma ? 'Elige la forma de pago.' : !d.pedido", "!d.forma ? 'Elige la forma de pago.' : d.forma === 'Otra' && d.otra.length < 3 ? 'Escribe cuál es la otra forma de pago.' : !d.pedido"),
  ("' rojo\">Anulada' : '\">' + esc(x.forma))", "' rojo\">Anulada' : '\">' + esc(x.forma + (x.otra ? ': ' + x.otra : '')))"),
]
PANEL = [
  ("'</td><td>' + e(x.forma) + '</td><td style=\"word-break", "'</td><td>' + e(x.forma) + (x.otra ? '<small>' + e(x.otra) + '</small>' : '') + '</td><td style=\"word-break"),
  ("'N° factura', 'Forma de pago', 'N° de pedido o comprobante'", "'N° factura', 'Forma de pago', 'Detalle otra', 'N° de pedido o comprobante'"),
  ("x.factura, x.forma, x.pedido, n2(x.valor)", "x.factura, x.forma, x.otra || '', x.pedido, n2(x.valor)"),
  ("(x.factura + ' ' + x.pedido + ' ' + (x.cliente || '')", "(x.factura + ' ' + x.pedido + ' ' + (x.cliente || '') + ' ' + (x.otra || '')"),
]
PRUEBA = [
  ("var FPG_FORMAS = ['Tarjeta de crédito', 'Tarjeta de débito', 'Transferencia', 'Steren Card', 'Shopping Dólares', 'Crédito directo', 'Cheque', 'Efectivo', 'Otra']",
   "var FPG_FORMAS = ['deUna', 'Transferencias', 'Shopping Dólares - Condado', 'MobiSol - Mall del Sol', 'Otra'], fpDe = function (t) { return FPG_FORMAS.filter(function (f) { return f.indexOf('Condado') > 0 ? /condado/i.test(t) : f.indexOf('MobiSol') === 0 ? /\\bsol\\b/i.test(t) : true; }); }"),
  ("'Estado', 'Anuló', 'Motivo anulación'];", "'Estado', 'Anuló', 'Motivo anulación', 'Detalle otra'];"),
  ("DB.escribir('Formas de pago!A1:S1', [FPG_CAB])", "DB.escribir('Formas de pago!A1:T1', [FPG_CAB])"),
  ("motivoAnula: S(r[18])};", "motivoAnula: S(r[18]), otra: S(r[19])};"),
  ("while (f.length < 19) f.push(''); DB.escribir('Formas de pago!A' + (i + 1) + ':S' + (i + 1), [f]);", "while (f.length < 20) f.push(''); DB.escribir('Formas de pago!A' + (i + 1) + ':T' + (i + 1), [f]);"),
  ("return {formas: FPG_FORMAS, hoy: DB.isoDe(new Date()),", "return {formas: fpDe(t), hoy: DB.isoDe(new Date()),"),
  ("if (FPG_FORMAS.indexOf(d.forma) < 0) throw new Error('Elige la forma de pago.');",
   "if (fpDe(t).indexOf(d.forma) < 0) throw new Error('Elige la forma de pago.'); var otra = d.forma === 'Otra' ? S(d.otra).trim() : ''; if (d.forma === 'Otra' && otra.length < 3) throw new Error('Escribe cuál es la otra forma de pago.');"),
  ("r[7] === d.forma && r[16] !== 'Anulada'", "r[7] === d.forma && (d.forma !== 'Otra' || S(r[19]).toLowerCase() === otra.toLowerCase()) && r[16] !== 'Anulada'"),
  ("d.foto || '', '', '', '', 'Vigente', '', ''];", "d.foto || '', '', '', '', 'Vigente', '', '', otra];"),
]
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read(); b = os.path.basename(p)
    if 'fpgOtra' in s or "id=\"pOW\"" in s or 'Detalle otra' in s: print('ya aplicado', p); continue
    R = PRUEBA if b == 'servidor.js' else ASESOR if b == 'asesor.html' else PANEL if b.lower() == 'panel.html' else TIENDA
    for a, n in R:
        if s.count(a) != 1: sys.exit('ancla (%d) en %s: %s' % (s.count(a), p, a[:80]))
        s = s.replace(a, n)
    open(p, 'w', encoding='utf-8').write(s); print('ok', p)
