#!/usr/bin/env python3
"""fpg1 (Diego 16-nov): Ventas › Formas de pago en el panel (Panel.html de Apps Script y panel.html del espejo).
La ven el administrador, el perfil Financiero y quien tenga 'ventas/formaspago' = Sí en 'Menús por perfil'.
Todas las tiendas, filtros (tienda, fechas, forma, búsqueda), totales por forma y exportación a Excel (CSV).
Uso: python3 aplicar_fpg1_panel.py <Panel.html> [...]"""
import sys

BTN_A = '<button data-v="flash" title="Venta del día y del mes contra presupuesto, desde el ERP">Flash de Ventas</button>'
BTN_B = BTN_A + '\n    <button data-v="formaspago" title="Formas de pago de las facturas del POS, registradas por las tiendas">Formas de pago</button>'
VIEW_A = '<div id="tipos" hidden></div>'
VIEW_B = ('<div class="view" data-view="formaspago" hidden>   <!-- fpg1 -->\n'
          '    <section class="panel" id="formaspago">\n'
          '      <div class="panel-h"><h2>Formas de pago</h2><span class="small faint">Lo que registran asesores y gerentes por cada factura del POS: forma de pago, n.º de pedido o comprobante (p. ej. Shopping Dólares) y valor con IVA.</span></div>\n'
          '      <div id="fpgBody"><div class="skeleton">Cargando formas de pago…</div></div>\n'
          '    </section>\n'
          '  </div>\n  ' + VIEW_A)
REPL = [
    ("const VISTAS = ['hoy','calendario','anuncios','flash','pendientes','supervision','inventario','vivo','politicas','clientes','guias','universidad','contactos'];",
     "const VISTAS = ['hoy','calendario','anuncios','flash','pendientes','supervision','inventario','vivo','politicas','clientes','guias','universidad','contactos','formaspago'];   // fpg1"),
    (BTN_A, BTN_B),
    (VIEW_A, VIEW_B),
    ('["flash", "pp", "Presupuesto por persona"]]', '["flash", "pp", "Presupuesto por persona"], ["formaspago", "", "Formas de pago"]]'),
    ('{"id": "ventas", "nombre": "Ventas", "vistas": ["flash"]}', '{"id": "ventas", "nombre": "Ventas", "vistas": ["flash", "formaspago"]}'),
    ("'clientes|vf': 'clientes/vf'};", "'clientes|vf': 'clientes/vf', 'formaspago|': 'ventas/formaspago'};"),
]

JS = r"""<style>/* fpg1 */
.fpg-f{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin-bottom:12px}
.fpg-f label{display:flex;flex-direction:column;font-size:12px;color:var(--fg-3,#6b7280);gap:3px}
.fpg-f select,.fpg-f input{font:inherit;font-size:14px;padding:7px 8px;border:1px solid var(--line);border-radius:8px;background:var(--surface,#fff);color:inherit;min-width:0}
.fpg-f .grow{flex:1;min-width:160px}
.fpg-k{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:0 0 12px}
.fpg-k div{border:1px solid var(--line);border-radius:12px;padding:8px 10px}
.fpg-k b{display:block;font-size:18px;font-variant-numeric:tabular-nums}.fpg-k span{font-size:12px;opacity:.7}
.fpg-t{width:100%;border-collapse:collapse;font-size:13.5px;font-variant-numeric:tabular-nums}
.fpg-t th,.fpg-t td{padding:7px 6px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
.fpg-t th{font-size:12px;color:var(--fg-3,#6b7280);font-weight:600}.fpg-t td.v,.fpg-t th.v{text-align:right;white-space:nowrap}
.fpg-t td small{display:block;opacity:.65;font-size:11.5px}
.fpg-wrap{overflow-x:auto}
.fpg-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 12px;margin:0 0 10px;border-radius:12px;background:var(--surface-2,#eef3f8)}
.fpg-bar input{font:inherit;font-size:14px;padding:7px 8px;border:1px solid var(--line);border-radius:8px;width:150px}
.fpg-ok{color:#1e7b45;font-weight:600}.fpg-pend{color:#9a6200;font-weight:600}
.fpg-t a{color:inherit}
.fpg-an td{opacity:.55}.fpg-an td:nth-child(7){text-decoration:line-through}.fpg-x{color:#b3261e;font-weight:600}
@media(max-width:700px){.fpg-t .c-reg,.fpg-t .c-hora{display:none}}
</style>
<script>/* fpg1: Ventas › Formas de pago (Diego 16-nov). Nada se borra: se anula con motivo. Todo queda en la bitácora. */
(function(){
  const F = {d: null, cargando: false, error: '', f: {t: '', desde: '', hasta: '', forma: '', q: '', ent: '', est: 'Vigente'}, sel: {}, bit: null, verBit: false, qb: ''};
  const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const usd = n => '$' + Number(n || 0).toLocaleString('es-EC', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const hoyIso = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const fCorta = i => i ? i.slice(8, 10) + '/' + i.slice(5, 7) + '/' + i.slice(0, 4) : '';
  const C = () => window.cvCtx || null, quien = () => { const c = C(), y = c && c.yo(); return (y && y.nombre) || ''; };
  const aviso = m => { if (typeof toast === 'function') toast(m, 4000); };
  function cargar(){
    if (F.cargando || !C()) { if (!F.cargando) setTimeout(cargar, 800); return; }
    if (!quien()) { setTimeout(cargar, 800); return; }
    F.cargando = true; F.error = '';
    C().api('apiFPGPanel', quien()).then(x => { F.d = x || {formas: [], lista: []}; })
      .catch(err => { F.error = (err && err.message) || 'No se pudo cargar.'; })
      .finally(() => { F.cargando = false; pintar(); });
  }
  function cargarBit(){
    F.bit = 'cargando'; pintar();
    C().api('apiFPGBitacora', quien()).then(x => { F.bit = x || []; pintar(); }).catch(err => { F.bit = null; F.verBit = false; aviso((err && err.message) || 'No se pudo abrir la bitácora.'); pintar(); });
  }
  function filtrar(){
    const L = (F.d && F.d.lista) || [], f = F.f, q = f.q.trim().toLowerCase().replace(/\s+/g, '');
    return L.filter(x => (!f.est || (x.estado || 'Vigente') === f.est) && (!f.t || x.tienda === f.t) && (!f.desde || x.fecha >= f.desde) && (!f.hasta || x.fecha <= f.hasta) &&
      (!f.forma || x.forma === f.forma) && (!f.ent || (f.ent === 'si') === !!x.entregado) &&
      (!q || (x.factura + ' ' + x.pedido + ' ' + (x.cliente || '') + ' ' + x.id).toLowerCase().replace(/\s+/g, '').indexOf(q) >= 0));
  }
  function csv(nombre, filas){
    const c = v => { const s = String(v == null ? '' : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const blob = new Blob(['﻿' + filas.map(r => r.map(c).join(';')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre + '.csv';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    C().api('apiFPGExporto', quien(), nombre + ' · ' + (filas.length - 1) + ' filas').catch(() => {});
  }
  const n2 = x => Number(x || 0).toFixed(2).replace('.', ',');
  function exportar(){
    const L = filtrar(); if (!L.length) { aviso('No hay registros para exportar.'); return; }
    csv('Formas de pago ' + (F.f.t || 'todas las tiendas') + ' ' + (F.f.desde || 'inicio') + ' a ' + (F.f.hasta || hoyIso()),
      [['ID', 'Fecha registro', 'Hora', 'Tienda', 'N° factura', 'Forma de pago', 'N° de pedido o comprobante', 'Valor pagado con IVA', 'Cliente', 'Total factura', 'Registró', 'Desde',
        'Entregado', 'N° recibo', 'Marcó entrega', 'Estado', 'Anuló', 'Motivo anulación', 'Foto']]
      .concat(L.map(x => [x.id, x.fecha, x.hora, x.tienda, x.factura, x.forma, x.pedido, n2(x.valor), x.cliente || '', x.valorFac ? n2(x.valorFac) : '', x.registroVer || x.registro, x.desde,
        x.entregado || '', x.recibo || '', x.marco || '', x.estado || 'Vigente', x.anulo || '', x.motivoAnula || '', x.foto || ''])));
  }
  function integridadHtml(){
    const I = F.d && F.d.integridad; if (!I) return '';
    if (I.ok) return '<p class="small faint" style="margin:0 0 10px">🔒 Bitácora íntegra: ' + I.lineas + ' movimientos registrados, ninguno alterado. <button class="btn" id="fpgB" style="margin-left:6px">Ver bitácora</button></p>';
    return '<div class="fpg-bar" style="background:#fde4e2;color:#8a1c14"><b>⚠ Revisión de trazabilidad:</b><span>' +
      (I.rotas.length ? 'se editó o borró a mano la bitácora (fila ' + I.rotas.join(', ') + '). ' : '') +
      (I.cambiadas.length ? I.cambiadas.length + ' registro(s) cambiados fuera de la app: ' + I.cambiadas.slice(0, 10).map(e).join(', ') + '.' : '') +
      '</span><button class="btn" id="fpgB">Ver bitácora</button></div>';
  }
  function bitHtml(){
    if (F.bit === 'cargando' || F.bit === null) return '<div class="skeleton">Cargando bitácora…</div>';
    const q = F.qb.trim().toLowerCase(), B = F.bit.filter(b => !q || (b.accion + ' ' + b.id + ' ' + b.tienda + ' ' + b.quien + ' ' + b.detalle).toLowerCase().indexOf(q) >= 0);
    return '<div class="fpg-f"><button class="btn" id="fpgBV">← Volver a los registros</button><label class="grow">Buscar en la bitácora<input type="search" id="fpgBQ" value="' + e(F.qb) + '" placeholder="ID, factura, persona, acción…"></label><button class="btn" id="fpgBX">Exportar bitácora</button></div>' +
      '<p class="small faint" style="margin:0 0 8px">Cada ingreso, anulación, entrega, consulta y exportación, con quién y cuándo. La app solo agrega líneas; nadie las puede borrar desde aquí.</p>' +
      (!B.length ? '<div class="empty">Sin movimientos.</div>' : '<div class="fpg-wrap"><table class="fpg-t"><thead><tr><th>Fecha</th><th>Acción</th><th>Registro</th><th>Quién</th><th>Detalle</th></tr></thead><tbody>' +
        B.slice(0, 500).map(b => '<tr><td>' + fCorta(b.fecha) + '<small>' + e(b.hora) + '</small></td><td><b>' + e(b.accion) + '</b></td><td>' + e(b.id) + '<small>' + e(b.tienda) + '</small></td><td>' + e(b.quien) + '<small>' + e(b.desde) + '</small></td><td style="word-break:break-word;max-width:420px">' + e(b.detalle) + '</td></tr>').join('') + '</tbody></table></div>');
  }
  function pintar(){
    const el = document.getElementById('fpgBody'); if (!el) return;
    if (F.error) { el.innerHTML = '<div class="empty">' + e(F.error) + ' <button class="btn" id="fpgRe">Reintentar</button></div>'; document.getElementById('fpgRe').onclick = () => { F.error = ''; cargar(); pintar(); }; return; }
    if (!F.d) { el.innerHTML = '<div class="skeleton">Cargando formas de pago…</div>'; return; }
    if (F.verBit) {
      el.innerHTML = bitHtml();
      const v = document.getElementById('fpgBV'); if (v) v.onclick = () => { F.verBit = false; pintar(); };
      const q = document.getElementById('fpgBQ'); if (q) q.addEventListener('input', () => { F.qb = q.value; pintar(); const y = document.getElementById('fpgBQ'); if (y) { y.focus(); y.setSelectionRange(y.value.length, y.value.length); } });
      const x = document.getElementById('fpgBX'); if (x) x.onclick = () => csv('Bitácora formas de pago ' + hoyIso(), [['Fecha', 'Hora', 'Acción', 'ID', 'Tienda', 'Quién', 'Desde', 'Detalle']].concat(F.bit.map(b => [b.fecha, b.hora, b.accion, b.id, b.tienda, b.quien, b.desde, b.detalle])));
      return;
    }
    const todas = F.d.lista || [], tiendas = [...new Set(todas.map(x => x.tienda))].sort(), formas = F.d.formas || [], f = F.f;
    const L = filtrar(), cuenta = f.est === 'Anulada' ? L : L.filter(x => x.estado !== 'Anulada'), tot = cuenta.reduce((a, x) => a + (x.valor || 0), 0), por = {};   // las anuladas no suman
    cuenta.forEach(x => { por[x.forma] = por[x.forma] || {v: 0, n: 0}; por[x.forma].v += x.valor || 0; por[x.forma].n++; });
    const opt = (v, txt, sel) => '<option value="' + e(v) + '"' + (v === sel ? ' selected' : '') + '>' + e(txt) + '</option>';
    let h = integridadHtml() + '<div class="fpg-f">' +
      '<label>Tienda<select id="fpgT">' + opt('', 'Todas', f.t) + tiendas.map(t => opt(t, t, f.t)).join('') + '</select></label>' +
      '<label>Desde<input type="date" id="fpgD" value="' + e(f.desde) + '"></label>' +
      '<label>Hasta<input type="date" id="fpgH" value="' + e(f.hasta) + '"></label>' +
      '<label>Forma de pago<select id="fpgF">' + opt('', 'Todas', f.forma) + formas.map(x => opt(x, x, f.forma)).join('') + '</select></label>' +
      '<label>Entrega<select id="fpgE">' + opt('', 'Todas', f.ent) + opt('no', 'Por entregar', f.ent) + opt('si', 'Entregadas', f.ent) + '</select></label>' +
      '<label>Estado<select id="fpgS">' + opt('Vigente', 'Vigentes', f.est) + opt('Anulada', 'Anuladas', f.est) + opt('', 'Todas', f.est) + '</select></label>' +
      '<label class="grow">Buscar factura, pedido, cliente o ID<input type="search" id="fpgQ" value="' + e(f.q) + '" placeholder="Ej.: 4800"></label>' +
      '<button class="btn" id="fpgX" title="Descarga lo filtrado; se abre en Excel">Exportar a Excel</button></div>';
    const vig = L.filter(x => x.estado !== 'Anulada'), pend = vig.filter(x => !x.entregado), sel = Object.keys(F.sel).filter(k => F.sel[k] && vig.some(x => x.id === k));
    if (sel.length) h += '<div class="fpg-bar"><b>' + sel.length + (sel.length === 1 ? ' elegida' : ' elegidas') + '</b>' +
      '<input id="fpgRec" placeholder="N° de recibo"><button class="btn" id="fpgEnt">Marcar entregadas</button>' +
      '<span style="opacity:.5">|</span><input id="fpgMot" placeholder="Motivo para anular" style="width:200px"><button class="btn" id="fpgAn">Anular</button>' +
      '<button class="btn" id="fpgSelNo">Cancelar</button></div>';
    h += '<div class="fpg-k"><div><b>' + usd(tot) + '</b><span>' + cuenta.length + (cuenta.length === 1 ? ' registro' : ' registros') + (f.est === 'Anulada' ? ' anulados' : '') + '</span></div>' +
      (pend.length && f.est !== 'Anulada' ? '<div><b class="fpg-pend">' + usd(pend.reduce((a, x) => a + (x.valor || 0), 0)) + '</b><span>Por entregar · ' + pend.length + '</span></div>' : '') +
      Object.keys(por).sort((a, b) => por[b].v - por[a].v).map(k => '<div><b>' + usd(por[k].v) + '</b><span>' + e(k) + ' · ' + por[k].n + '</span></div>').join('') + '</div>';
    h += !L.length ? '<div class="empty">' + (todas.length ? 'No hay registros con estos filtros.' : 'Todavía no hay formas de pago registradas.') + '</div>' :
      '<div class="fpg-wrap"><table class="fpg-t"><thead><tr><th style="width:26px"></th><th>Fecha</th><th>Tienda</th><th>Factura</th><th>Forma de pago</th><th>Pedido o comprobante</th><th class="v">Pagado (con IVA)</th><th class="c-reg">Registró</th><th>Entrega</th></tr></thead><tbody>' +
      L.slice(0, 500).map(x => { const an = x.estado === 'Anulada';
        return '<tr' + (an ? ' class="fpg-an"' : '') + '><td>' + (an ? '' : '<input type="checkbox" data-fps="' + e(x.id) + '"' + (F.sel[x.id] ? ' checked' : '') + ' title="Elegir para marcar la entrega o anular">') + '</td><td>' + fCorta(x.fecha) + '<small class="c-hora">' + e(x.hora) + ' · ' + e(x.id) + '</small></td><td>' + e(x.tienda) + '</td><td>' + e(x.factura) + (x.cliente ? '<small>' + e(x.cliente) + '</small>' : '') + '</td><td>' + e(x.forma) + '</td><td style="word-break:break-word;max-width:260px">' + e(x.pedido) + '</td><td class="v">' + usd(x.valor) + (x.valorFac ? '<small>de ' + usd(x.valorFac) + '</small>' : '') + '</td><td class="c-reg">' + e(x.registroVer || x.registro) + '<small>' + e(x.desde) + '</small></td><td>' +
          (an ? '<span class="fpg-x">Anulada</span><small>' + e(x.anulo) + ': ' + e(x.motivoAnula) + '</small>' : x.entregado ? '<span class="fpg-ok">Recibo ' + e(x.recibo) + '</span><small>' + fCorta(x.entregado) + (x.marco ? ' · ' + e(x.marco) : '') + '</small>' : '<span class="fpg-pend">Por entregar</span>') +
          (x.foto ? '<small><a href="' + e(x.foto) + '" target="_blank" rel="noopener">ver foto</a></small>' : '') + '</td></tr>'; }).join('') +
      '</tbody></table></div>' + (L.length > 500 ? '<p class="small faint">Se muestran los 500 más recientes; la exportación lleva todos (' + L.length + ').</p>' : '');
    el.innerHTML = h;
    const on = (id, k, ev) => { const x = document.getElementById(id); if (x) x.addEventListener(ev || 'change', () => { F.f[k] = x.value; pintar(); if (ev === 'input') { const y = document.getElementById(id); if (y) { y.focus(); y.setSelectionRange(y.value.length, y.value.length); } } }); };
    on('fpgT', 't'); on('fpgD', 'desde'); on('fpgH', 'hasta'); on('fpgF', 'forma'); on('fpgE', 'ent'); on('fpgS', 'est'); on('fpgQ', 'q', 'input');
    el.querySelectorAll('[data-fps]').forEach(c => c.onchange = () => { F.sel[c.dataset.fps] = c.checked; pintar(); });
    const b = document.getElementById('fpgB'); if (b) b.onclick = () => { F.verBit = true; cargarBit(); };
    const no = document.getElementById('fpgSelNo'); if (no) no.onclick = () => { F.sel = {}; pintar(); };
    const poner = R => (R || []).forEach(r => { const i = F.d.lista.findIndex(x => x.id === r.id); if (i >= 0) F.d.lista[i] = r; });
    const ok = document.getElementById('fpgEnt'); if (ok) ok.onclick = () => {
      const rec = document.getElementById('fpgRec').value.trim(), ids = Object.keys(F.sel).filter(k => F.sel[k]);
      if (!rec) { aviso('Escribe el N° de recibo.'); return; }
      ok.disabled = true; ok.textContent = 'Guardando…';
      C().api('apiFPGEntregar', quien(), ids, rec).then(R => { poner(R); F.sel = {}; pintar(); aviso('Listo: ' + (R || []).length + ' marcadas con el recibo ' + rec + '.'); })
        .catch(err => { ok.disabled = false; ok.textContent = 'Marcar entregadas'; aviso((err && err.message) || 'No se pudo guardar.'); });
    };
    const an = document.getElementById('fpgAn'); if (an) an.onclick = async () => {
      const mot = document.getElementById('fpgMot').value.trim(), ids = Object.keys(F.sel).filter(k => F.sel[k]);
      if (mot.length < 5) { aviso('Escribe el motivo de la anulación (queda en la bitácora).'); return; }
      an.disabled = true; an.textContent = 'Anulando…'; let n = 0;
      for (const id of ids) { try { poner([await C().api('apiFPGAnularPanel', quien(), id, mot)]); n++; } catch (err) { aviso(id + ': ' + ((err && err.message) || 'no se pudo anular')); } }
      F.sel = {}; pintar(); if (n) aviso(n + (n === 1 ? ' registro anulado.' : ' registros anulados.'));
    };
    document.getElementById('fpgX').onclick = exportar;
  }
  const hoy = hoyIso(); F.f.desde = hoy.slice(0, 8) + '01'; F.f.hasta = hoy;
  const v = document.querySelector('.view[data-view="formaspago"]');
  if (v) {
    const mira = () => { if (!v.hidden && !F.d && !F.cargando) { cargar(); pintar(); } };
    new MutationObserver(mira).observe(v, {attributes: true, attributeFilter: ['hidden']}); mira();
    const r = document.getElementById('refresh'); if (r) r.addEventListener('click', () => { F.verBit = false; if (!v.hidden) { F.d = null; cargar(); pintar(); } else F.d = null; });
  }
})();
</script>
"""

for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    if '/* fpg1' in s:
        print('ya aplicado', p); continue
    for a, b in REPL:
        c = s.count(a)
        if c != 1: sys.exit('ancla %d veces en %s: %s' % (c, p, a[:80]))
        s = s.replace(a, b)
    i = s.rfind('</body>')
    if i < 0: sys.exit('sin </body> en ' + p)
    s = s[:i] + JS + s[i:]
    open(p, 'w', encoding='utf-8').write(s)
    print('ok', p)
