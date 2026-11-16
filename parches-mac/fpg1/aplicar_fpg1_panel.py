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
          '      <div class="panel-h"><h2>Formas de pago</h2><span class="small faint">Lo que registran asesores y gerentes por cada factura del POS: forma de pago, n.º de pedido y valor con IVA.</span></div>\n'
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
@media(max-width:700px){.fpg-t .c-reg,.fpg-t .c-hora{display:none}}
</style>
<script>/* fpg1: Ventas › Formas de pago (Diego 16-nov) */
(function(){
  const F = {d: null, cargando: false, error: '', f: {t: '', desde: '', hasta: '', forma: '', q: ''}};
  const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const usd = n => '$' + Number(n || 0).toLocaleString('es-EC', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const hoyIso = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const fCorta = i => i ? i.slice(8, 10) + '/' + i.slice(5, 7) + '/' + i.slice(0, 4) : '';
  const C = () => window.cvCtx || null, quien = () => { const c = C(), y = c && c.yo(); return (y && y.nombre) || ''; };
  function cargar(){
    if (F.cargando || !C()) { if (!F.cargando) setTimeout(cargar, 800); return; }
    if (!quien()) { setTimeout(cargar, 800); return; }
    F.cargando = true; F.error = '';
    C().api('apiFPGPanel', quien()).then(x => { F.d = x || {formas: [], lista: []}; })
      .catch(err => { F.error = (err && err.message) || 'No se pudo cargar.'; })
      .finally(() => { F.cargando = false; pintar(); });
  }
  function filtrar(){
    const L = (F.d && F.d.lista) || [], f = F.f, q = f.q.trim().toLowerCase().replace(/\s+/g, '');
    return L.filter(x => (!f.t || x.tienda === f.t) && (!f.desde || x.fecha >= f.desde) && (!f.hasta || x.fecha <= f.hasta) && (!f.forma || x.forma === f.forma) &&
      (!q || (x.factura + ' ' + x.pedido).toLowerCase().replace(/\s+/g, '').indexOf(q) >= 0));
  }
  function exportar(){
    const L = filtrar(); if (!L.length) { if (typeof toast === 'function') toast('No hay registros para exportar.'); return; }
    const c = v => { const s = String(v == null ? '' : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const filas = [['Fecha registro', 'Hora', 'Tienda', 'N° factura', 'Forma de pago', 'N° de pedido', 'Valor con IVA', 'Registró', 'Desde', 'ID']]
      .concat(L.map(x => [x.fecha, x.hora, x.tienda, x.factura, x.forma, x.pedido, Number(x.valor || 0).toFixed(2).replace('.', ','), x.registroVer || x.registro, x.desde, x.id]));
    const blob = new Blob(['﻿' + filas.map(r => r.map(c).join(';')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'Formas de pago ' + (F.f.t || 'todas las tiendas') + ' ' + (F.f.desde || 'inicio') + ' a ' + (F.f.hasta || hoyIso()) + '.csv';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function pintar(){
    const el = document.getElementById('fpgBody'); if (!el) return;
    if (F.error) { el.innerHTML = '<div class="empty">' + e(F.error) + ' <button class="btn" id="fpgRe">Reintentar</button></div>'; document.getElementById('fpgRe').onclick = () => { F.error = ''; cargar(); pintar(); }; return; }
    if (!F.d) { el.innerHTML = '<div class="skeleton">Cargando formas de pago…</div>'; return; }
    const todas = F.d.lista || [], tiendas = [...new Set(todas.map(x => x.tienda))].sort(), formas = F.d.formas || [], f = F.f;
    const L = filtrar(), tot = L.reduce((a, x) => a + (x.valor || 0), 0), por = {};
    L.forEach(x => { por[x.forma] = por[x.forma] || {v: 0, n: 0}; por[x.forma].v += x.valor || 0; por[x.forma].n++; });
    const opt = (v, txt, sel) => '<option value="' + e(v) + '"' + (v === sel ? ' selected' : '') + '>' + e(txt) + '</option>';
    let h = '<div class="fpg-f">' +
      '<label>Tienda<select id="fpgT">' + opt('', 'Todas', f.t) + tiendas.map(t => opt(t, t, f.t)).join('') + '</select></label>' +
      '<label>Desde<input type="date" id="fpgD" value="' + e(f.desde) + '"></label>' +
      '<label>Hasta<input type="date" id="fpgH" value="' + e(f.hasta) + '"></label>' +
      '<label>Forma de pago<select id="fpgF">' + opt('', 'Todas', f.forma) + formas.map(x => opt(x, x, f.forma)).join('') + '</select></label>' +
      '<label class="grow">Buscar factura o pedido<input type="search" id="fpgQ" value="' + e(f.q) + '" placeholder="Ej.: 4800"></label>' +
      '<button class="btn" id="fpgX" title="Descarga lo filtrado; se abre en Excel">Exportar a Excel</button></div>';
    h += '<div class="fpg-k"><div><b>' + usd(tot) + '</b><span>' + L.length + (L.length === 1 ? ' registro' : ' registros') + '</span></div>' +
      Object.keys(por).sort((a, b) => por[b].v - por[a].v).map(k => '<div><b>' + usd(por[k].v) + '</b><span>' + e(k) + ' · ' + por[k].n + '</span></div>').join('') + '</div>';
    h += !L.length ? '<div class="empty">' + (todas.length ? 'No hay registros con estos filtros.' : 'Todavía no hay formas de pago registradas.') + '</div>' :
      '<div class="fpg-wrap"><table class="fpg-t"><thead><tr><th>Fecha</th><th>Tienda</th><th>Factura</th><th>Forma de pago</th><th>N° de pedido</th><th class="v">Valor con IVA</th><th class="c-reg">Registró</th></tr></thead><tbody>' +
      L.slice(0, 500).map(x => '<tr><td>' + fCorta(x.fecha) + '<small class="c-hora">' + e(x.hora) + '</small></td><td>' + e(x.tienda) + '</td><td>' + e(x.factura) + '</td><td>' + e(x.forma) + '</td><td>' + e(x.pedido) + '</td><td class="v">' + usd(x.valor) + '</td><td class="c-reg">' + e(x.registroVer || x.registro) + '<small>' + e(x.desde) + '</small></td></tr>').join('') +
      '</tbody></table></div>' + (L.length > 500 ? '<p class="small faint">Se muestran los 500 más recientes; la exportación lleva todos (' + L.length + ').</p>' : '');
    el.innerHTML = h;
    const on = (id, k, ev) => { const x = document.getElementById(id); if (x) x.addEventListener(ev || 'change', () => { F.f[k] = x.value; pintar(); if (ev === 'input') { const y = document.getElementById(id); if (y) { y.focus(); y.setSelectionRange(y.value.length, y.value.length); } } }); };
    on('fpgT', 't'); on('fpgD', 'desde'); on('fpgH', 'hasta'); on('fpgF', 'forma'); on('fpgQ', 'q', 'input');
    document.getElementById('fpgX').onclick = exportar;
  }
  const hoy = hoyIso(); F.f.desde = hoy.slice(0, 8) + '01'; F.f.hasta = hoy;
  const v = document.querySelector('.view[data-view="formaspago"]');
  if (v) {
    const mira = () => { if (!v.hidden && !F.d && !F.cargando) { cargar(); pintar(); } };
    new MutationObserver(mira).observe(v, {attributes: true, attributeFilter: ['hidden']}); mira();
    const r = document.getElementById('refresh'); if (r) r.addEventListener('click', () => { if (!v.hidden) { F.d = null; cargar(); pintar(); } else F.d = null; });
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
