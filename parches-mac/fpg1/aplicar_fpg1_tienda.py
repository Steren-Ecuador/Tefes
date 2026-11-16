#!/usr/bin/env python3
"""fpg1 (Diego 16-nov): registrar formas de pago de facturas del POS desde la página de la tienda (Index.html / tienda.html).
Va en la pestaña Inventario, junto a Ventas futuras y Autoconsumo. Uso: python3 aplicar_fpg1_tienda.py <Index.html> [...]"""
import sys

A_RENDER = "$('#main').innerHTML = vfHtml() + aucHtml() + inventarioHtml() + informesInvHtml();   // aco1"
B_RENDER = "$('#main').innerHTML = vfHtml() + fpgHtml() + aucHtml() + inventarioHtml() + informesInvHtml();   // aco1 + fpg1"
A_ENL = "vfEnlazar(); aucEnlazar();"
B_ENL = "vfEnlazar(); aucEnlazar(); fpgEnlazar();"
A_FUN = "function renderInv(){"
FUN = r"""/* ---------- fpg1: FORMAS DE PAGO de facturas del POS (Diego 2026-11-16). Una fila por factura y forma de pago. ---------- */
const FPGS = {lista: null, formas: [], cargando: false, error: '', todos: false};
const fpgUsd = n => '$' + Number(n || 0).toFixed(2).replace('.', ',');
function fpgCargar(){
  if (FPGS.cargando) return; FPGS.cargando = true; FPGS.error = '';
  api('apiFPGLista').then(r => { FPGS.lista = (r && r.lista) || []; FPGS.formas = (r && r.formas) || []; FPGS.hoy = r && r.hoy; }).catch(e => { FPGS.error = e.message || 'No se pudo cargar.'; })
    .finally(() => { FPGS.cargando = false; if (S.vista === 'inv') renderInv(); });
}
function fpgHtml(){
  if (FPGS.lista === null && !FPGS.error) fpgCargar();
  const L = FPGS.lista || [], hoy = S.data.hoy || new Date().toISOString().slice(0, 10), deHoy = L.filter(x => x.fecha === hoy && x.estado !== 'Anulada');
  let h = '<div class="sec-t" style="margin-top:16px"><h3>Formas de pago</h3><span class="tiny muted">' + (deHoy.length ? deHoy.length + ' hoy · ' + fpgUsd(deHoy.reduce((a, x) => a + x.valor, 0)) : '') + '</span></div>';
  h += '<button class="btn block" id="fpgNuevo">+ Registrar forma de pago de una factura</button>';
  if (FPGS.error) h += '<div class="card small" style="margin-top:10px">' + esc(FPGS.error) + ' <button class="link" id="fpgRe">Reintentar</button></div>';
  else if (FPGS.lista === null) h += '<div class="card muted small" style="margin-top:10px"><span class="spin"></span> Cargando…</div>';
  else if (!L.length) h += '<p class="tiny muted" style="margin:8px 2px 0">Registra aquí la factura del POS con su forma de pago, el n.º de pedido o comprobante y el valor con IVA (por ejemplo, lo pagado con Shopping Dólares).</p>';
  else {
    const V = FPGS.todos ? L : L.slice(0, 8);
    h += '<div class="card" style="margin-top:10px">' + V.map(x => '<div class="vf-it"' + (x.estado === 'Anulada' ? ' style="opacity:.55"' : '') + '><div class="vf-h"><b>Fact. ' + esc(x.factura) + ' · ' + fpgUsd(x.valor) + '</b><span class="tag ' + (x.estado === 'Anulada' ? 'vf-no">Anulada' : 'vf-esp">' + esc(x.forma)) + '</span></div>' +
      (x.cliente ? '<div class="small">' + esc(x.cliente) + (x.valorFac ? ' · factura de ' + fpgUsd(x.valorFac) : '') + '</div>' : '') + '<div class="tiny muted" style="word-break:break-word">Pedido/comprobante ' + esc(x.pedido) + ' · registró ' + esc(x.registroVer || x.registro) + ' el ' + fechaCorta(x.fecha) + (x.hora ? ' · ' + esc(x.hora) : '') + (x.foto ? ' · <a href="' + esc(x.foto) + '" target="_blank" rel="noopener">ver foto</a>' : '') + '</div>' +
      (x.entregado ? '<div class="tiny" style="color:var(--ok)">Entregado con recibo ' + esc(x.recibo) + ' el ' + fechaCorta(x.entregado) + '</div>' : '') +
      (x.estado === 'Anulada' ? '<div class="tiny" style="color:var(--bad)">Anulada por ' + esc(x.anulo) + ': ' + esc(x.motivoAnula) + '</div>' : '') +
      (x.estado !== 'Anulada' && !x.entregado && x.fecha === (FPGS.hoy || hoy) ? '<button class="link" data-fpgan="' + esc(x.id) + '" style="margin-top:4px">Anular (me equivoqué)</button>' : '') + '</div>').join('') +
      (L.length > V.length ? '<button class="link" id="fpgTodos" style="margin-top:6px">Ver los ' + L.length + ' de los últimos 60 días</button>' : '') + '</div>';
  }
  return h;
}
function fpgEnlazar(){
  const n = $('#fpgNuevo'); if (n) n.onclick = fpgFormulario;
  const re = $('#fpgRe'); if (re) re.onclick = () => { FPGS.error = ''; FPGS.lista = null; renderInv(); };
  const t = $('#fpgTodos'); if (t) t.onclick = () => { FPGS.todos = true; renderInv(); };
  document.querySelectorAll('[data-fpgan]').forEach(b => b.onclick = () => fpgAnular(b.dataset.fpgan));
}
function fpgAnular(id){
  const x = (FPGS.lista || []).find(y => y.id === id); if (!x) return;
  openModal('<h3>Anular registro</h3><p class="small muted" style="margin:0">Fact. ' + esc(x.factura) + ' · ' + esc(x.forma) + ' · ' + fpgUsd(x.valor) + '. No se borra: queda anulado y en la bitácora con tu nombre y el motivo.</p>' +
    '<label class="f">Motivo</label><textarea id="fpgAMot" maxlength="300" placeholder="Ej.: puse mal el valor; lo registro de nuevo"></textarea>' +
    '<label class="f">¿Quién anula?</label>' + vfQuien('fpgAQuien') +
    '<div class="row" style="margin-top:14px"><button class="btn ghost grow" id="fpgANo">Cancelar</button><button class="btn primary grow" id="fpgASi">Anular</button></div>');
  $('#fpgANo').onclick = closeModal;
  $('#fpgASi').onclick = async () => {
    const mot = $('#fpgAMot').value.trim(), per = $('#fpgAQuien').value.trim();
    if (mot.length < 5) { toast('Escribe el motivo.', 3000); return; } if (!per) { toast('Elige tu nombre.', 3000); return; }
    const b = $('#fpgASi'); b.disabled = true; b.textContent = 'Anulando…';
    try { const r = await api('apiFPGAnularTienda', id, per, mot); const i = FPGS.lista.findIndex(y => y.id === id); if (i >= 0) FPGS.lista[i] = r;
      if (window.REG) REG.ev('Forma de pago anulada', id); closeModal(); toast('Anulado. Queda en la bitácora.', 3000); renderInv();
    } catch (e) { b.disabled = false; b.textContent = 'Anular'; toast(e.message || 'No se pudo anular.', 4000); }
  };
}
function fpgFormulario(){
  const F = FPGS.formas.length ? FPGS.formas : ['Tarjeta de crédito', 'Tarjeta de débito', 'Transferencia', 'Steren Card', 'Shopping Dólares', 'Crédito directo', 'Cheque', 'Efectivo', 'Otra'];
  openModal('<h3>Forma de pago de una factura</h3>' +
    '<p class="small muted" style="margin:0">Si la factura se pagó con dos formas, registra cada una por separado.</p>' +
    '<label class="f">N° de factura</label><input type="text" id="fpgFac" inputmode="numeric" autocomplete="off" placeholder="005-001-000004800">' +
    '<label class="f">Forma de pago</label><select id="fpgForma"><option value="">Elige la forma de pago</option>' + F.map(m => '<option>' + esc(m) + '</option>').join('') + '</select>' +
    '<label class="f">N° de pedido o comprobante</label><textarea id="fpgPed" maxlength="1500" rows="2" placeholder="N° de pedido, voucher o los números de los Shopping Dólares"></textarea>' +
    '<div class="grid2"><div><label class="f">Valor pagado con esta forma (con IVA)</label><input type="number" id="fpgVal" min="0" step="0.01" inputmode="decimal" placeholder="0,00"></div>' +
    '<div><label class="f">Total de la factura (opcional)</label><input type="number" id="fpgTot" min="0" step="0.01" inputmode="decimal" placeholder="0,00"></div></div>' +
    '<label class="f">Cliente (opcional)</label><input type="text" id="fpgCli" maxlength="100" autocomplete="off" placeholder="Nombre del cliente">' +
    '<label class="f">¿Quién registra?</label>' + vfQuien('fpgQuien') +
    '<label class="f">Foto de la factura o de los vales (opcional)</label><input type="file" id="fpgFoto" accept="image/*">' +
    '<div class="row" style="margin-top:14px"><button class="btn ghost grow" id="fpgNo">Cancelar</button><button class="btn primary grow" id="fpgSi">Guardar</button></div>');
  $('#fpgNo').onclick = closeModal;
  $('#fpgSi').onclick = async () => {
    const d = {factura: $('#fpgFac').value.trim(), forma: $('#fpgForma').value, pedido: $('#fpgPed').value.trim(), valor: $('#fpgVal').value, valorFac: $('#fpgTot').value, cliente: $('#fpgCli').value.trim(), registro: $('#fpgQuien').value.trim(), desde: 'Tienda'};
    const falta = (d.factura.match(/\d/g) || []).length < 3 ? 'Escribe el número de factura.' : !d.forma ? 'Elige la forma de pago.' : !d.pedido ? 'Escribe el número de pedido o comprobante.' :
      !(Number(d.valor) > 0) ? 'Pon el valor pagado con esta forma.' : Number(d.valorFac) > 0 && Number(d.valorFac) < Number(d.valor) ? 'El total de la factura no puede ser menor que lo pagado con esta forma.' : !d.registro ? 'Elige tu nombre.' : '';
    if (falta) { toast(falta, 3500); return; }
    const b = $('#fpgSi'); b.disabled = true;
    try {
      const f = $('#fpgFoto').files && $('#fpgFoto').files[0];
      if (f) { b.textContent = 'Subiendo foto…'; const u = await api('apiSubirFoto', await reducirFoto(f, 'Pago ' + d.factura), 'pago_' + d.factura.replace(/\D/g, '')); d.foto = u.url; }
      b.textContent = 'Guardando…';
      const r = await api('apiFPGRegistrar', d);
      (FPGS.lista = FPGS.lista || []).unshift(r);
      if (window.REG) REG.ev('Forma de pago', r.id + ' · ' + r.factura);
      closeModal(); toast('Registrada. ¡Gracias!', 3000); renderInv();
    } catch (e) { b.disabled = false; b.textContent = 'Guardar'; toast(e.message || 'No se pudo guardar. Revisa tu internet.', 4000); }
  };
}
"""

for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if 'fpg1' in s:
        print('ya aplicado', p); continue
    for a, b in [(A_RENDER, B_RENDER), (A_ENL, B_ENL), (A_FUN, FUN + A_FUN)]:
        c = s.count(a)
        if c != 1: sys.exit('ancla %d veces en %s: %s' % (c, p, a[:80]))
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s)
    print('ok', p)
