#!/usr/bin/env python3
"""fpg1 (Diego 16-nov): el asesor registra la forma de pago de sus facturas del POS (asesor.html, solo GitHub).
Clientes › Pagos. Ve los suyos de los últimos 60 días. Uso: python3 aplicar_fpg1_asesor.py asesor.html"""
import sys

REPL = [
    ("[['pro', 'Proformas'], ['vf', 'Lista de espera']]", "[['pro', 'Proformas'], ['vf', 'Lista de espera'], ['fp', 'Pagos']]"),
    ("  if (segCli === 'pro'){   /* pf2 */", "  if (segCli === 'fp') h += fpgAsesorHtml();   /* fpg1 */\n  else if (segCli === 'pro'){   /* pf2 */"),
    ("  if ($('#nVf')) $('#nVf').onclick = formFutura;\n}", "  if ($('#nVf')) $('#nVf').onclick = formFutura;\n  if ($('#nFp')) $('#nFp').onclick = formPago;   /* fpg1 */\n  document.querySelectorAll('[data-fpan]').forEach(b => b.onclick = () => anularPago(b.dataset.fpan));\n}"),
    ("let CAT = null;", r"""/* fpg1: formas de pago de facturas del POS (Diego 2026-11-16) */
const FPG = {lista: null, formas: [], cargando: false, error: ''};
function fpgCargarA(){
  if (FPG.cargando) return; FPG.cargando = true; FPG.error = '';
  llamar('apiFPGLista', TOKEN).then(r => { FPG.lista = (r && r.lista) || []; FPG.formas = (r && r.formas) || []; FPG.hoy = r && r.hoy; }, e => { FPG.error = e.message; })
    .then(() => { FPG.cargando = false; if (vista === 'cli' && segCli === 'fp') renderCli(); });
}
function fpgAsesorHtml(){
  if (FPG.lista === null && !FPG.error) fpgCargarA();
  const mios = (FPG.lista || []).filter(x => x.registro === YO.nombre), hoyI = FPG.hoy || iso(HOY), hoyL = mios.filter(x => x.fecha === hoyI && x.estado !== 'Anulada');
  let h = '<button class="btn pri block" id="nFp" style="margin-bottom:12px">+ Registrar forma de pago</button>';
  if (FPG.error) return h + '<div class="card vacio">' + esc(FPG.error) + '</div>';
  if (FPG.lista === null) return h + '<div class="card vacio">Cargando…</div>';
  if (hoyL.length) h += '<div class="card"><div class="tiny muted">HOY</div><b>' + hoyL.length + (hoyL.length === 1 ? ' factura' : ' facturas') + ' · ' + usd2(hoyL.reduce((a, x) => a + x.valor, 0)) + '</b></div>';
  h += mios.length ? mios.slice(0, 30).map(x => '<div class="card"' + (x.estado === 'Anulada' ? ' style="opacity:.55"' : '') + '><div class="fila"><b>Fact. ' + esc(x.factura) + '</b><span class="chip' + (x.estado === 'Anulada' ? ' rojo">Anulada' : '">' + esc(x.forma)) + '</span></div>' +
    '<div class="small" style="margin-top:4px">' + usd2(x.valor) + (x.cliente ? ' · ' + esc(x.cliente) : '') + '</div><div class="tiny muted" style="word-break:break-word">' + esc(x.pedido) + '</div>' + (x.entregado ? '<div class="tiny" style="color:var(--ok)">Entregado · recibo ' + esc(x.recibo) + '</div>' : '') + (x.estado === 'Anulada' ? '<div class="tiny" style="color:var(--bad)">' + esc(x.motivoAnula) + '</div>' : '') + (x.estado !== 'Anulada' && !x.entregado && x.fecha === hoyI ? '<button class="btn" data-fpan="' + esc(x.id) + '" style="margin-top:6px;font-size:13px">Anular (me equivoqué)</button>' : '') + '<div class="tiny muted">' + fCorta(new Date(x.fecha + 'T12:00:00')) + (x.hora ? ' · ' + esc(x.hora) : '') + '</div></div>').join('')
    : '<div class="card vacio">Registra aquí cada factura del POS con su forma de pago, el n.º de pedido o comprobante y el valor con IVA.</div>';
  return h;
}
function fpgFoto(f){ return new Promise((ok, ko) => { const img = new Image(), u = URL.createObjectURL(f); img.onload = () => { const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', 0.8)); }; img.onerror = () => ko(new Error('No pude leer la foto.')); img.src = u; }); }
function anularPago(id){
  abrir('<h3>Anular registro</h3><p class="small muted" style="margin:0 0 4px">No se borra: queda anulado, con tu nombre y el motivo.</p><label class="f">Motivo</label><textarea class="i" id="aM" maxlength="300" placeholder="Ej.: puse mal el valor"></textarea>' +
    '<div class="dos" style="margin-top:14px"><button class="btn" id="cx">Cancelar</button><button class="btn pri" id="ok">Anular</button></div>');
  $('#cx').onclick = cerrar;
  $('#ok').onclick = () => { const m = $('#aM').value.trim(); if (m.length < 5) return toast('Escribe el motivo.');
    ocupado('#ok'); llamar('apiFPGAnularTienda', TOKEN, id, YO.nombre, m).then(r => { const i = FPG.lista.findIndex(x => x.id === id); if (i >= 0) FPG.lista[i] = r; cerrar(); toast('Anulado.'); renderCli(); }, e => { libre('#ok'); toast(e.message); }); };
}
function formPago(){
  const F = FPG.formas.length ? FPG.formas : ['Tarjeta de crédito', 'Tarjeta de débito', 'Transferencia', 'Steren Card', 'Shopping Dólares', 'Crédito directo', 'Cheque', 'Efectivo', 'Otra'];
  abrir('<h3>Forma de pago</h3><p class="small muted" style="margin:0 0 4px">Si la factura se pagó con dos formas, registra cada una por separado.</p>' +
    '<label class="f">N° de factura</label><input class="i" id="pF" inputmode="numeric" autocomplete="off" placeholder="005-001-000004800">' +
    '<label class="f">Forma de pago</label><select class="i" id="pP"><option value="">Elige la forma de pago</option>' + F.map(x => '<option>' + esc(x) + '</option>').join('') + '</select>' +
    '<label class="f">N° de pedido o comprobante</label><textarea class="i" id="pN" maxlength="1500" rows="2" placeholder="Pedido, voucher o números de Shopping Dólares"></textarea>' +
    '<div class="dos"><div><label class="f">Pagado con esta forma</label><input class="i" id="pV" inputmode="decimal" placeholder="0,00"></div><div><label class="f">Total factura (opcional)</label><input class="i" id="pT" inputmode="decimal" placeholder="0,00"></div></div>' +
    '<label class="f">Cliente (opcional)</label><input class="i" id="pC" maxlength="100" autocomplete="off">' +
    '<label class="f">Foto de la factura o de los vales (opcional)</label><input class="i" type="file" id="pFo" accept="image/*">' +
    '<div class="dos" style="margin-top:14px"><button class="btn" id="cx">Cancelar</button><button class="btn pri" id="ok">Guardar</button></div>');
  $('#cx').onclick = cerrar;
  $('#ok').onclick = () => {
    const d = {factura: $('#pF').value.trim(), forma: $('#pP').value, pedido: $('#pN').value.trim(), valor: Number($('#pV').value.replace(',', '.')) || 0, valorFac: Number($('#pT').value.replace(',', '.')) || 0, cliente: $('#pC').value.trim(), registro: YO.nombre, desde: 'Asesor'};
    const falta = (d.factura.match(/\d/g) || []).length < 3 ? 'Escribe el número de factura.' : !d.forma ? 'Elige la forma de pago.' : !d.pedido ? 'Escribe el número de pedido o comprobante.' : !(d.valor > 0) ? 'Pon el valor pagado con esta forma.' : d.valorFac && d.valorFac < d.valor ? 'El total de la factura no puede ser menor que lo pagado.' : '';
    if (falta) return toast(falta);
    ocupado('#ok'); const fo = $('#pFo').files && $('#pFo').files[0];
    (fo ? fpgFoto(fo).then(u => llamar('apiSubirFoto', TOKEN, u, 'pago_' + d.factura.replace(/\D/g, ''))).then(r => { d.foto = r.url; }) : Promise.resolve())
      .then(() => llamar('apiFPGRegistrar', TOKEN, d)).then(r => { (FPG.lista = FPG.lista || []).unshift(r); cerrar(); toast('¡Registrada! 🙌'); renderCli(); }, e => { libre('#ok'); toast(e.message); });
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
