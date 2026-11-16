#!/usr/bin/env python3
"""fpg1 (Diego 16-nov): el asesor registra la forma de pago de sus facturas del POS (asesor.html, solo GitHub).
Clientes › Pagos. Ve los suyos de los últimos 60 días. Uso: python3 aplicar_fpg1_asesor.py asesor.html"""
import sys

REPL = [
    ("[['pro', 'Proformas'], ['vf', 'Lista de espera']]", "[['pro', 'Proformas'], ['vf', 'Lista de espera'], ['fp', 'Pagos']]"),
    ("  if (segCli === 'pro'){   /* pf2 */", "  if (segCli === 'fp') h += fpgAsesorHtml();   /* fpg1 */\n  else if (segCli === 'pro'){   /* pf2 */"),
    ("  if ($('#nVf')) $('#nVf').onclick = formFutura;\n}", "  if ($('#nVf')) $('#nVf').onclick = formFutura;\n  if ($('#nFp')) $('#nFp').onclick = formPago;   /* fpg1 */\n}"),
    ("let CAT = null;", r"""/* fpg1: formas de pago de facturas del POS (Diego 2026-11-16) */
const FPG = {lista: null, formas: [], cargando: false, error: ''};
function fpgCargarA(){
  if (FPG.cargando) return; FPG.cargando = true; FPG.error = '';
  llamar('apiFPGLista', TOKEN).then(r => { FPG.lista = (r && r.lista) || []; FPG.formas = (r && r.formas) || []; }, e => { FPG.error = e.message; })
    .then(() => { FPG.cargando = false; if (vista === 'cli' && segCli === 'fp') renderCli(); });
}
function fpgAsesorHtml(){
  if (FPG.lista === null && !FPG.error) fpgCargarA();
  const mios = (FPG.lista || []).filter(x => x.registro === YO.nombre), hoyI = iso(HOY), hoyL = mios.filter(x => x.fecha === hoyI);
  let h = '<button class="btn pri block" id="nFp" style="margin-bottom:12px">+ Registrar forma de pago</button>';
  if (FPG.error) return h + '<div class="card vacio">' + esc(FPG.error) + '</div>';
  if (FPG.lista === null) return h + '<div class="card vacio">Cargando…</div>';
  if (hoyL.length) h += '<div class="card"><div class="tiny muted">HOY</div><b>' + hoyL.length + (hoyL.length === 1 ? ' factura' : ' facturas') + ' · ' + usd2(hoyL.reduce((a, x) => a + x.valor, 0)) + '</b></div>';
  h += mios.length ? mios.slice(0, 30).map(x => '<div class="card"><div class="fila"><b>Fact. ' + esc(x.factura) + '</b><span class="chip">' + esc(x.forma) + '</span></div>' +
    '<div class="small" style="margin-top:4px">' + usd2(x.valor) + ' · pedido ' + esc(x.pedido) + '</div><div class="tiny muted">' + fCorta(new Date(x.fecha + 'T12:00:00')) + (x.hora ? ' · ' + esc(x.hora) : '') + '</div></div>').join('')
    : '<div class="card vacio">Registra aquí cada factura del POS con su forma de pago, el número de pedido y el valor con IVA.</div>';
  return h;
}
function formPago(){
  const F = FPG.formas.length ? FPG.formas : ['Tarjeta de crédito', 'Tarjeta de débito', 'Transferencia', 'Steren Card', 'Crédito directo', 'Cheque', 'Efectivo', 'Otra'];
  abrir('<h3>Forma de pago</h3><p class="small muted" style="margin:0 0 4px">Si la factura se pagó con dos formas, registra cada una por separado.</p>' +
    '<label class="f">N° de factura</label><input class="i" id="pF" inputmode="numeric" autocomplete="off" placeholder="005-001-000004800">' +
    '<label class="f">Forma de pago</label><select class="i" id="pP"><option value="">Elige la forma de pago</option>' + F.map(x => '<option>' + esc(x) + '</option>').join('') + '</select>' +
    '<div class="dos"><div><label class="f">N° de pedido</label><input class="i" id="pN" maxlength="40" autocomplete="off"></div><div><label class="f">Valor con IVA</label><input class="i" id="pV" inputmode="decimal" placeholder="0,00"></div></div>' +
    '<div class="dos" style="margin-top:14px"><button class="btn" id="cx">Cancelar</button><button class="btn pri" id="ok">Guardar</button></div>');
  $('#cx').onclick = cerrar;
  $('#ok').onclick = () => {
    const d = {factura: $('#pF').value.trim(), forma: $('#pP').value, pedido: $('#pN').value.trim(), valor: Number($('#pV').value.replace(',', '.')) || 0, registro: YO.nombre, desde: 'Asesor'};
    const falta = (d.factura.match(/\d/g) || []).length < 3 ? 'Escribe el número de factura.' : !d.forma ? 'Elige la forma de pago.' : !d.pedido ? 'Escribe el número de pedido.' : !(d.valor > 0) ? 'Pon el valor con IVA.' : '';
    if (falta) return toast(falta);
    ocupado('#ok'); llamar('apiFPGRegistrar', TOKEN, d).then(r => { (FPG.lista = FPG.lista || []).unshift(r); cerrar(); toast('¡Registrada! 🙌'); renderCli(); }, e => { libre('#ok'); toast(e.message); });
  };
}
let CAT = null;"""),
]
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if 'fpg1' in s:
        print('ya aplicado', p); continue
    for a, b in REPL:
        c = s.count(a)
        if c != 1: sys.exit('ancla %d veces en %s: %s' % (c, p, a[:80]))
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s)
    print('ok', p)
