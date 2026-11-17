#!/usr/bin/env python3
"""fpg8 (Diego 17-nov): "Formas de pago" es tema propio del menú principal con dos opciones: Transferencias y Otros (Notas de crédito, Préstamos empleados, Descuentos por inventarios).
- Transferencias: deUna (valor $ + comprobante), Tipti (valor $ + N° de pedido), Transferencia bancaria (cuenta Tefes + valor + comprobante), Otra (detalle: Shopping Dólares, MobiSol…).
- Notas de crédito: N° NC (SRI), factura a la que aplica, motivo, valor.   - Préstamos empleados: empleado, cuotas, valor.
- Siempre: factura SRI, fecha factura, total con IVA, quién registra; fecha y hora del registro automáticas.
Se aplica DESPUÉS de fpg6 y fpg7. Uso: python3 aplicar_fpg8.py <archivo> ...  (Index.html|tienda.html, asesor.html|Asesores.html, Panel.html|panel.html, prueba/servidor.js)
Necesita wizard_fpg8.js y FormasPago.gs en la misma carpeta. Idempotente."""
import sys, os
AQUI = os.path.dirname(os.path.abspath(__file__))
WIZ = open(os.path.join(AQUI, 'wizard_fpg8.js'), encoding='utf-8').read()
GS = open(os.path.join(AQUI, 'FormasPago.gs'), encoding='utf-8').read()
VAL = GS[GS.index('/* fpg5: VALIDACIÓN CONTABLE'):GS.index('\nfunction apiFPGRegistrar(')]
INIS = ['/* fpg8 (Diego 17-nov): asistente', '/* fpg5 (Diego 16-nov']

def entre(s, a, b, nuevo):
    i = s.index(a); j = s.index(b, i); return s[:i] + nuevo + s[j:]

def wiz(s, fin):
    ini = next(x for x in INIS if x in s)
    return entre(s, ini, fin, WIZ)

def rep(s, R, q):
    for a, n in R:
        if n in s: continue          # ya aplicado
        assert s.count(a) == 1, q + ': ' + a[:70]; s = s.replace(a, n)
    return s

FPG_JS = r"""const FPG_GRUPOS = [['tr', 'Transferencias'], ['ot', 'Otros']];   // fpg8
const FPG_OTROS = ['Nota de crédito', 'Préstamo empleado', 'Descuento inventario'], fpgGrupo = x => FPG_OTROS.indexOf(x.forma) >= 0 || (FPGS.extras || []).some(e => e.n === x.forma && e.g === 'ot') ? 'ot' : 'tr';
const fpgNom = f => ({'Transferencias': 'Transferencia', 'Préstamo empleado': 'Préstamo a empleado', 'Descuento inventario': 'Descuento por inventario'})[f] || f;
const fpgRefTxt = x => x.forma === 'Nota de crédito' ? 'NC ' + x.pedido + (x.banco ? ' · devuelta ' + x.banco : '') + (x.otra ? ' · ' + x.otra : '') : x.forma === 'Préstamo empleado' ? 'Empleado ' + (x.otra || '') + ' · ' + x.pedido + (x.pedido == 1 ? ' cuota de ' : ' cuotas de ') + fpgUsd(Math.floor(x.valor * 100 / (Number(x.pedido) || 1)) / 100) + ' al mes' : x.forma === 'Descuento inventario' ? 'Empleado ' + (x.otra || '') + ' · inventario ' + x.pedido + ' · ' + x.banco + (x.banco == 1 ? ' cuota de ' : ' cuotas de ') + fpgUsd(Math.floor(x.valor * 100 / (Number(x.banco) || 1)) / 100) + ' al mes' :
  (x.forma === 'Tipti' ? 'Pedido ' : 'Comprobante ') + x.pedido + (x.banco ? ' · ' + x.banco : '');
"""

def tienda(s):
    s = wiz(s, 'function fpgFormulario(){')
    if 'const FPG_GRUPOS' not in s:
        s = s.replace("const FPGS = {lista: null, formas: [], cargando: false, error: '', todos: false};", "const FPGS = {lista: null, formas: [], cargando: false, error: '', todos: false, grupo: 'tr'};\n" + FPG_JS, 1)
    i = s.index('function fpgHtml(){'); j = s.index('function fpgEnlazar(){')
    s = s[:i] + r"""function fpgHtml(){   // fpg8: Transferencias | Notas de crédito | Préstamos empleados
  if (FPGS.lista === null && !FPGS.error) fpgCargar();
  const G = FPGS.grupo || 'tr', L = (FPGS.lista || []).filter(x => fpgGrupo(x) === G), hoy = S.data.hoy || new Date().toISOString().slice(0, 10), deHoy = L.filter(x => x.fecha === hoy && x.estado !== 'Anulada');
  let h = '<div class="sec-t" style="margin-top:16px"><h3>Formas de pago</h3><span class="tiny muted">' + (deHoy.length ? deHoy.length + ' hoy · ' + fpgUsd(deHoy.reduce((a, x) => a + x.valor, 0)) : '') + '</span></div>';
  h += '<div class="seg fpg-seg" style="margin-bottom:10px">' + FPG_GRUPOS.map(([k, l]) => '<button data-fpgg="' + k + '" class="' + (k === G ? 'on' : '') + '" style="flex:1">' + l + '</button>').join('') + '</div>';
  h += '<button class="btn block" id="fpgNuevo">' + ({tr: '+ Registrar pago con deUna, Tipti, transferencia u otra', ot: '+ Registrar nota de crédito, préstamo o descuento por inventario'})[G] + '</button>';
  if (FPGS.error) h += '<div class="card small" style="margin-top:10px">' + esc(FPGS.error) + ' <button class="link" id="fpgRe">Reintentar</button></div>';
  else if (FPGS.lista === null) h += '<div class="card muted small" style="margin-top:10px"><span class="spin"></span> Cargando…</div>';
  else if (!L.length) h += '<p class="tiny muted" style="margin:8px 2px 0">' + ({tr: 'Cada vez que un cliente pague con deUna, Tipti, transferencia bancaria u otra forma (Shopping Dólares, MobiSol…), regístralo aquí.', ot: 'Aquí van las facturas pagadas con nota de crédito, con préstamo a empleado (descuento en el rol) o con descuento por inventario.'})[G] + '</p>';
  else {
    const V = FPGS.todos ? L : L.slice(0, 8);
    h += '<div class="card" style="margin-top:10px">' + V.map(x => '<div class="vf-it"' + (x.estado === 'Anulada' ? ' style="opacity:.55"' : '') + '><div class="vf-h"><b>Fact. ' + esc(x.factura) + ' · ' + fpgUsd(x.valor) + '</b><span class="tag ' + (x.estado === 'Anulada' ? 'vf-no">Anulada' : 'vf-esp">' + esc(fpgNom(x.forma) + (x.forma === 'Otra' && x.otra ? ': ' + x.otra : ''))) + '</span></div>' +
      (x.cliente ? '<div class="small">' + esc(x.cliente) + (x.valorFac ? ' · factura de ' + fpgUsd(x.valorFac) : '') + '</div>' : '') + '<div class="tiny muted" style="word-break:break-word">' + esc(fpgRefTxt(x)) + (x.vendedor ? ' · vendió ' + esc(x.vendedorVer || x.vendedor) : '') + ' · registró ' + esc(x.registroVer || x.registro) + ' el ' + fechaCorta(x.fecha) + (x.hora ? ' · ' + esc(x.hora) : '') + (x.foto ? ' · <a href="' + esc(x.foto) + '" target="_blank" rel="noopener">ver foto</a>' : '') + '</div>' +
      (x.entregado ? '<div class="tiny" style="color:var(--ok)">Entregado con recibo ' + esc(x.recibo) + ' el ' + fechaCorta(x.entregado) + '</div>' : '') +
      (x.estado === 'Anulada' ? '<div class="tiny" style="color:var(--bad)">Anulada por ' + esc(x.anulo) + ': ' + esc(x.motivoAnula) + '</div>' : '') +
      (x.estado !== 'Anulada' && !x.entregado && x.fecha === (FPGS.hoy || hoy) ? '<button class="link" data-fpgan="' + esc(x.id) + '" style="margin-top:4px">Anular (me equivoqué)</button>' : '') + '</div>').join('') +
      (L.length > V.length ? '<button class="link" id="fpgTodos" style="margin-top:6px">Ver los ' + L.length + ' de los últimos 60 días</button>' : '') + '</div>';
  }
  return h;
}
""" + s[j:]
    R = [("FPGS.prefijo = (r && r.prefijo) || '';", "FPGS.prefijo = (r && r.prefijo) || ''; FPGS.extras = (r && r.extras) || [];"),
         ("  const n = $('#fpgNuevo'); if (n) n.onclick = fpgFormulario;", "  const n = $('#fpgNuevo'); if (n) n.onclick = fpgFormulario;\n  document.querySelectorAll('[data-fpgg]').forEach(b => b.onclick = () => { FPGS.grupo = b.dataset.fpgg; FPGS.todos = false; renderPago(); });   // fpg8"),
         ("formas: FPGS.formas, prefijo: FPGS.prefijo, hoy: FPGS.hoy || (S.data && S.data.hoy),", "formas: FPGS.formas, extras: FPGS.extras, grupo: FPGS.grupo || 'tr', prefijo: FPGS.prefijo, hoy: FPGS.hoy || (S.data && S.data.hoy),")]
    return rep(s, R, 'tienda')

def asesor(s):
    s = wiz(s, 'function formPago(){')
    R = [("FPG.prefijo = (r && r.prefijo) || '';", "FPG.prefijo = (r && r.prefijo) || ''; FPG.extras = (r && r.extras) || [];"),
         ("formas: FPG.formas, prefijo: FPG.prefijo, hoy: FPG.hoy,", "formas: FPG.formas, extras: FPG.extras, grupo: 'asesor', prefijo: FPG.prefijo, hoy: FPG.hoy,"),
         ("<span class=\"chip' + (x.estado === 'Anulada' ? ' rojo\">Anulada' : '\">' + esc(x.forma + (x.otra ? ': ' + x.otra : '') + (x.banco ? ' · ' + x.banco : ''))) + '</span>",
          "<span class=\"chip' + (x.estado === 'Anulada' ? ' rojo\">Anulada' : '\">' + esc((x.forma === 'Transferencias' ? 'Transferencia' : x.forma) + (x.forma === 'Otra' && x.otra ? ': ' + x.otra : ''))) + '</span>"),
         ("'</div><div class=\"tiny muted\" style=\"word-break:break-word\">' + esc(x.pedido) + '</div>'",
          "'</div><div class=\"tiny muted\" style=\"word-break:break-word\">' + esc(x.forma === 'Nota de crédito' ? 'NC ' + x.pedido + ' · devuelta ' + x.banco + (x.otra ? ' · ' + x.otra : '') : (x.forma === 'Tipti' ? 'Pedido ' : 'Comprobante ') + x.pedido + (x.banco ? ' · ' + x.banco : '')) + '</div>'")]
    return rep(s, R, 'asesor')

def panel(s):
    R = [  # menú: tema propio con tres opciones
        ('["flash", "pp", "Presupuesto por persona"], ["formaspago", "", "Formas de pago"]], ', '["flash", "pp", "Presupuesto por persona"]], "formaspago": [["formaspago", "tr", "Transferencias"], ["formaspago", "ot", "Otros"]], '),
        ('{"id": "ventas", "nombre": "Ventas", "vistas": ["flash", "formaspago"]}, ', '{"id": "ventas", "nombre": "Ventas", "vistas": ["flash"]}, {"id": "formaspago", "nombre": "Formas de pago", "vistas": ["formaspago"]}, '),
        ("'formaspago|': 'ventas/formaspago'};", "'formaspago|': 'ventas/formaspago', 'formaspago|tr': 'ventas/formaspago', 'formaspago|ot': 'ventas/formaspago'};"),
        # filtro por opción del menú
        ("    return L.filter(x => (!f.est || (x.estado || 'Vigente') === f.est) &&",
         "    const vw = document.querySelector('.view[data-view=\"formaspago\"]'), G = (vw && vw.dataset.sub) || 'tr';   // fpg8\n    const grp = x => ['Nota de crédito', 'Préstamo empleado', 'Descuento inventario'].indexOf(x.forma) >= 0 || (F.d.extras || []).some(e => e.n === x.forma && e.g === 'ot') ? 'ot' : 'tr';\n    return L.filter(x => grp(x) === G && (!f.est || (x.estado || 'Vigente') === f.est) &&"),
        ("const todas = F.d.lista || [], tiendas = [...new Set(todas.map(x => x.tienda))].sort(), formas = F.d.formas || [], f = F.f;",
         "const todas = F.d.lista || [], tiendas = [...new Set(todas.map(x => x.tienda))].sort(), f = F.f, vw8 = document.querySelector('.view[data-view=\"formaspago\"]'), G8 = (vw8 && vw8.dataset.sub) || 'tr';\n    const OT8 = ['Nota de crédito', 'Préstamo empleado', 'Descuento inventario'], EX8 = F.d.extras || [], formas = G8 === 'ot' ? OT8.concat(EX8.filter(x => x.g === 'ot').map(x => x.n)) : [...new Set(['deUna', 'Tipti', 'Transferencias', 'Otra'].concat(EX8.filter(x => x.g !== 'ot').map(x => x.n), todas.map(x => x.forma).filter(x => OT8.indexOf(x) < 0 && !EX8.some(e => e.n === x && e.g === 'ot'))))];   // fpg8\n    if (f.forma && formas.indexOf(f.forma) < 0) f.forma = '';"),
        ("'</td><td>' + e(x.forma) + (x.otra ? '<small>' + e(x.otra) + '</small>' : '') + (x.banco ? '<small>' + e(x.banco) + '</small>' : '') + '</td><td style=\"word-break:break-word;max-width:260px\">' + e(x.pedido) + '</td>",
         "'</td><td>' + e(x.forma === 'Transferencias' ? 'Transferencia' : x.forma) + (x.forma === 'Préstamo empleado' || x.forma === 'Descuento inventario' ? '<small>' + e(x.otra) + '</small>' : x.forma === 'Nota de crédito' ? '<small>devuelta ' + e(x.banco) + '</small><small>' + e(x.otra) + '</small>' : (x.otra ? '<small>' + e(x.otra) + '</small>' : '') + (x.banco ? '<small>' + e(x.banco) + '</small>' : '')) + '</td><td style=\"word-break:break-word;max-width:260px\">' + e(x.forma === 'Préstamo empleado' ? x.pedido + ' cuota(s) de ' + usd(Math.floor(x.valor * 100 / (Number(x.pedido) || 1)) / 100) + ' al mes' : x.forma === 'Descuento inventario' ? 'Inventario ' + x.pedido + ' · ' + x.banco + ' cuota(s) de ' + usd(Math.floor(x.valor * 100 / (Number(x.banco) || 1)) / 100) + ' al mes' : x.pedido) + '</td>"),
        ("<th>Forma de pago</th><th>Pedido o comprobante</th>", "<th>Forma de pago</th><th>' + (G8 === 'ot' ? 'N° NC, cuotas o inventario' : 'Pedido o comprobante') + '</th>"),
        ("csv('Formas de pago ' + (F.f.t || 'todas las tiendas')", "csv(({tr: 'Transferencias', ot: 'Otros'}[(document.querySelector('.view[data-view=\"formaspago\"]') || {dataset: {}}).dataset.sub] || 'Formas de pago') + ' ' + (F.f.t || 'todas las tiendas')"),
        ("'Forma de pago', 'Detalle otra', 'Banco', 'N° de pedido, documento o referencia',", "'Forma de pago', 'Detalle / motivo NC / empleado', 'Cuenta que recibió / factura devuelta (NC) / cuotas (inventario)', 'Comprobante, N° de pedido, N° NC, cuotas o inventario',"),
        ("new MutationObserver(mira).observe(v, {attributes: true, attributeFilter: ['hidden']}); mira();",
         "new MutationObserver(mira).observe(v, {attributes: true, attributeFilter: ['hidden']}); mira();\n    new MutationObserver(() => { F.sel = {}; if (F.d) pintar(); }).observe(v, {attributes: true, attributeFilter: ['data-sub']});   // fpg8: cambia la opción del menú"),
        ("Lo que registran asesores y gerentes por cada factura del POS: forma de pago, n.º de pedido o comprobante (p. ej. Shopping Dólares) y valor con IVA.",
         "Lo que registran asesores y gerentes por cada factura del POS: transferencias (deUna, Tipti, banco, otras) y otros (notas de crédito, préstamos a empleados y descuentos por inventarios)."),
    ]
    s = rep(s, R, 'panel')
    # fpg7 ya no hace falta (Formas de pago es tema propio); se deja inactivo
    s = s.replace("find(t => t.id === 'ventas');   // fpg7", "find(t => t.id === 'ventas-fpg7-inactivo');   // fpg7")
    return s

def prueba(s):
    R = [("var FPG_FORMAS = ['deUna', 'Transferencias', 'Tipti', 'Shopping Dólares - Condado', 'MobiSol - Mall del Sol', 'Otra'], fpDe = function (t) { return FPG_FORMAS.filter(function (f) { return f.indexOf('Condado') > 0 ? /condado/i.test(t) : f.indexOf('MobiSol') === 0 ? /\\bsol\\b/i.test(t) : true; }); }",
          "var FPG_FORMAS = ['deUna', 'Tipti', 'Transferencias', 'Otra', 'Nota de crédito', 'Préstamo empleado', 'Descuento inventario'], fpDe = function (t) { return FPG_FORMAS.slice(); }")]
    R += [("fpDe = function (t) { return FPG_FORMAS.slice(); }", "fpDe = function (t) { return FPG_FORMAS.slice(); }, fpExtras = function () { try { return JSON.parse(localStorage.getItem('fpgExtrasPrueba') || '[]'); } catch (e) { return []; } }, fpNs = function (ex) { return ex.map(function (x) { return x.n; }); }"),
          ("return {formas: fpDe(t), hoy:", "var ex = fpExtras(); return {formas: fpDe(t).concat(fpNs(ex)), extras: ex, hoy:"),
          ("return {formas: FPG_FORMAS, lista:", "var ex = fpExtras(); return {formas: FPG_FORMAS.concat(fpNs(ex)), extras: ex, lista:"),
          ("var v = fpgValidar_(d, t, L.slice(1).map(fpObj), DB.isoDe(dd), fpDe(t));", "var ex = fpExtras(), v = fpgValidar_(d, t, L.slice(1).map(fpObj), DB.isoDe(dd), fpDe(t).concat(fpNs(ex)), ex);")]
    s = rep(s, R, 'prueba')
    return entre(s, '/* fpg5: VALIDACIÓN CONTABLE', '\n  API.apiFPGRegistrar = function (tok, d) {', VAL)

for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read(); b = os.path.basename(p)
    if b == 'servidor.js': s = prueba(s)
    elif 'function fpgFormulario(){' in s: s = tienda(s)
    elif 'function formPago(){' in s: s = asesor(s)
    elif 'data-view="formaspago"' in s: s = panel(s)
    else: sys.exit('no reconozco ' + p)
    open(p, 'w', encoding='utf-8').write(s); print('ok', p)
