#!/usr/bin/env python3
"""fpg4 (Diego 16-nov, formato de Yadira Román/Financiero): agrega Tipti, banco en transferencias y el nombre del campo según la forma
(N° pedido Tipti, N° de documento, Referencia deUna). En la tienda, Formas de pago sale de Inventario y pasa a opción principal "Ventas".
Se aplica DESPUÉS de fpg1 y fpg2. Uso: python3 aplicar_fpg4.py <archivo> ... (Index.html, tienda.html, asesor.html, Panel.html, panel.html, prueba/servidor.js)"""
import sys, os, re
PED = "const FPG_PED = {'deUna': 'Referencia deUna', 'Transferencias': 'N° de documento de la transferencia', 'Tipti': 'N° de pedido Tipti (7 dígitos)', 'Shopping Dólares - Condado': 'Números de los Shopping Dólares', 'MobiSol - Mall del Sol': 'Números de los vales MobiSol', 'Otra': 'N° de comprobante'};   // fpg4\n"
BANCOS = "<datalist id=\"fpgBancos\"><option>Pichincha</option><option>Pacífico</option><option>Guayaquil</option><option>Produbanco</option><option>Bolivariano</option><option>Internacional</option><option>Austro</option><option>Machala</option></datalist>"
VER = "(x.forma + (x.otra ? ': ' + x.otra : '') + (x.banco ? ' · ' + x.banco : ''))"
TIENDA = [
  ("const F = FPGS.formas.length ? FPGS.formas : ['deUna', 'Transferencias', 'Otra'];", "const F = FPGS.formas.length ? FPGS.formas : ['deUna', 'Transferencias', 'Tipti', 'Otra'];"),
  ("function fpgFormulario(){", PED + "function fpgFormulario(){"),
  ("placeholder=\"Ej.: tarjeta de crédito\"></div>' +", "placeholder=\"Ej.: tarjeta de crédito\"></div>' +\n    '<div id=\"fpgBanW\" style=\"display:none\"><label class=\"f\">Banco</label><input type=\"text\" id=\"fpgBan\" list=\"fpgBancos\" maxlength=\"40\" autocomplete=\"off\" placeholder=\"Ej.: Pichincha\">" + BANCOS + "</div>' +"),
  ("'<label class=\"f\">N° de pedido o comprobante</label><textarea id=\"fpgPed\"", "'<label class=\"f\" id=\"fpgPedL\">N° de pedido o comprobante</label><textarea id=\"fpgPed\""),
  ("$('#fpgForma').onchange = () => { $('#fpgOtraW').style.display = $('#fpgForma').value === 'Otra' ? '' : 'none'; };",
   "$('#fpgForma').onchange = () => { const v = $('#fpgForma').value; $('#fpgOtraW').style.display = v === 'Otra' ? '' : 'none'; $('#fpgBanW').style.display = v === 'Transferencias' ? '' : 'none'; $('#fpgPedL').textContent = FPG_PED[v] || 'N° de pedido o comprobante'; };"),
  ("otra: $('#fpgOtra').value.trim(),", "otra: $('#fpgOtra').value.trim(), banco: $('#fpgBan').value.trim(),"),
  ("d.forma === 'Otra' && d.otra.length < 3 ? 'Escribe cuál es la otra forma de pago.' : !d.pedido ? 'Escribe el número de pedido o comprobante.' :",
   "d.forma === 'Otra' && d.otra.length < 3 ? 'Escribe cuál es la otra forma de pago.' : d.forma === 'Transferencias' && d.banco.length < 3 ? 'Escribe el banco de la transferencia.' : !d.pedido ? 'Escribe el ' + (FPG_PED[d.forma] || 'número de pedido o comprobante') + '.' : d.forma === 'Tipti' && d.pedido.replace(/\\D/g, '').length !== 7 ? 'El pedido Tipti tiene 7 dígitos.' :"),
  ("esc(x.forma + (x.otra ? ': ' + x.otra : ''))", "esc" + VER),
  # menú: opción principal Ventas
  ("    <button data-v=\"pend\">", "    <button data-v=\"pago\"><svg class=\"ic\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M3 6h18v12H3zM3 10h18M7 15h4\"/></svg>Ventas</button>\n    <button data-v=\"pend\">"),
  ("temas: [{\"id\": \"inicio\", \"nombre\": \"Inicio\", \"vistas\": [\"inicio\"]}, ", "temas: [{\"id\": \"inicio\", \"nombre\": \"Inicio\", \"vistas\": [\"inicio\"]}, {\"id\": \"ventas\", \"nombre\": \"Ventas\", \"vistas\": [\"pago\"]}, "),
  ("  items: [{\"t\": \"Hoy\",", "  items: [{\"t\": \"Formas de pago de las facturas\", \"v\": \"pago\", \"sub\": \"Ventas · registrar deUna, transferencias, Tipti, Shopping Dólares, MobiSol\", \"kw\": \"forma pago formas deuna transferencia banco tipti shopping dolares mobisol voucher factura\"}, {\"t\": \"Hoy\","),
  ("pend: 'Pendientes', inv: 'Inventario',", "pend: 'Pendientes', pago: 'Ventas · Formas de pago', inv: 'Inventario',"),
  ("  else if(S.vista === 'inv') renderInv();", "  else if(S.vista === 'pago') renderPago();\n  else if(S.vista === 'inv') renderInv();"),
  ("$('#main').innerHTML = vfHtml() + fpgHtml() + aucHtml()", "$('#main').innerHTML = vfHtml() + aucHtml()"),
  ("  vfEnlazar(); aucEnlazar(); fpgEnlazar();\n}", "  vfEnlazar(); aucEnlazar();\n}\nfunction renderPago(){   // fpg4: Ventas › Formas de pago (opción principal del menú)\n  $('#main').innerHTML = fpgHtml();\n  fpgEnlazar();\n}"),
]
ASESOR = [
  ("const F = FPG.formas.length ? FPG.formas : ['deUna', 'Transferencias', 'Otra'];", "const F = FPG.formas.length ? FPG.formas : ['deUna', 'Transferencias', 'Tipti', 'Otra'];"),
  ("function formPago(){", PED + "function formPago(){"),
  ("placeholder=\"Ej.: tarjeta de crédito\"></div>' +", "placeholder=\"Ej.: tarjeta de crédito\"></div>' +\n    '<div id=\"pBW\" style=\"display:none\"><label class=\"f\">Banco</label><input class=\"i\" id=\"pB\" list=\"fpgBancos\" maxlength=\"40\" autocomplete=\"off\" placeholder=\"Ej.: Pichincha\">" + BANCOS + "</div>' +"),
  ("'<label class=\"f\">N° de pedido o comprobante</label><textarea class=\"i\" id=\"pN\"", "'<label class=\"f\" id=\"pNL\">N° de pedido o comprobante</label><textarea class=\"i\" id=\"pN\""),
  ("$('#pP').onchange = () => { $('#pOW').style.display = $('#pP').value === 'Otra' ? '' : 'none'; };",
   "$('#pP').onchange = () => { const v = $('#pP').value; $('#pOW').style.display = v === 'Otra' ? '' : 'none'; $('#pBW').style.display = v === 'Transferencias' ? '' : 'none'; $('#pNL').textContent = FPG_PED[v] || 'N° de pedido o comprobante'; };"),
  ("otra: $('#pO').value.trim(),", "otra: $('#pO').value.trim(), banco: $('#pB').value.trim(),"),
  ("d.forma === 'Otra' && d.otra.length < 3 ? 'Escribe cuál es la otra forma de pago.' : !d.pedido ? 'Escribe el número de pedido o comprobante.' :",
   "d.forma === 'Otra' && d.otra.length < 3 ? 'Escribe cuál es la otra forma de pago.' : d.forma === 'Transferencias' && d.banco.length < 3 ? 'Escribe el banco de la transferencia.' : !d.pedido ? 'Escribe el ' + (FPG_PED[d.forma] || 'número de pedido o comprobante') + '.' : d.forma === 'Tipti' && d.pedido.replace(/\\D/g, '').length !== 7 ? 'El pedido Tipti tiene 7 dígitos.' :"),
  ("esc(x.forma + (x.otra ? ': ' + x.otra : ''))", "esc" + VER),
]
PANEL = [
  ("e(x.forma) + (x.otra ? '<small>' + e(x.otra) + '</small>' : '')", "e(x.forma) + (x.otra ? '<small>' + e(x.otra) + '</small>' : '') + (x.banco ? '<small>' + e(x.banco) + '</small>' : '')"),
  ("'Forma de pago', 'Detalle otra', 'N° de pedido o comprobante'", "'Forma de pago', 'Detalle otra', 'Banco', 'N° de pedido, documento o referencia'"),
  ("x.forma, x.otra || '', x.pedido,", "x.forma, x.otra || '', x.banco || '', x.pedido,"),
  ("(x.cliente || '') + ' ' + (x.otra || '')", "(x.cliente || '') + ' ' + (x.otra || '') + ' ' + (x.banco || '')"),
]
PRUEBA = [
  ("var FPG_FORMAS = ['deUna', 'Transferencias', 'Shopping", "var FPG_FORMAS = ['deUna', 'Transferencias', 'Tipti', 'Shopping"),
  ("'Motivo anulación', 'Detalle otra'];", "'Motivo anulación', 'Detalle otra', 'Banco'];"),
  ("DB.escribir('Formas de pago!A1:T1', [FPG_CAB]);", "DB.escribir('Formas de pago!A1:U1', [FPG_CAB]);"),
  ("otra: S(r[19])};", "otra: S(r[19]), banco: S(r[20])};"),
  ("while (f.length < 20) f.push(''); DB.escribir('Formas de pago!A' + (i + 1) + ':T' + (i + 1), [f]);", "while (f.length < 21) f.push(''); DB.escribir('Formas de pago!A' + (i + 1) + ':U' + (i + 1), [f]);"),
  ("if (d.forma === 'Otra' && otra.length < 3) throw new Error('Escribe cuál es la otra forma de pago.');",
   "if (d.forma === 'Otra' && otra.length < 3) throw new Error('Escribe cuál es la otra forma de pago.'); var banco = d.forma === 'Transferencias' ? S(d.banco).trim() : ''; if (d.forma === 'Transferencias' && banco.length < 3) throw new Error('Escribe el banco de la transferencia.'); if (d.forma === 'Tipti' && S(d.pedido).replace(/\\D/g, '').length !== 7) throw new Error('El pedido Tipti tiene 7 dígitos.');"),
  ("'Vigente', '', '', otra];", "'Vigente', '', '', otra, banco];"),
]
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read(); b = os.path.basename(p)
    if 'fpg4' in s or 'FPG_PED' in s or "'Banco'];" in s: print('ya aplicado', p); continue
    R = PRUEBA if b == 'servidor.js' else ASESOR if b == 'asesor.html' else PANEL if b.lower() == 'panel.html' else TIENDA
    for a, n in R:
        if s.count(a) != 1: sys.exit('ancla (%d) en %s: %s' % (s.count(a), p, a[:90]))
        s = s.replace(a, n)
    if R is TIENDA:   # las recargas de la lista de formas de pago pintan la vista Ventas, no Inventario
        i = s.index('/* ---------- fpg1: FORMAS DE PAGO'); j = s.index('function renderInv(){', i)
        blk = s[i:j].replace("S.vista === 'inv') renderInv()", "S.vista === 'pago') renderPago()").replace('renderInv()', 'renderPago()')
        s = s[:i] + blk + s[j:]
    open(p, 'w', encoding='utf-8').write(s); print('ok', p)
