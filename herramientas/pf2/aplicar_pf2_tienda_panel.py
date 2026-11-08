#!/usr/bin/env python3
"""pf2 · Proformas: vista del gerente (Index.html / tienda.html) y resumen solo con números (Panel.html / panel.html).
Uso: python3 aplicar_pf2_tienda_panel.py tienda ruta/Index.html   |   python3 aplicar_pf2_tienda_panel.py panel ruta/Panel.html
Idempotente (marcador pf2)."""
import sys
modo, p = sys.argv[1], sys.argv[2]; s = open(p, encoding='utf-8').read()
if 'pf2:' in s: print('ya aplicado:', p); sys.exit(0)
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit('FALTA ancla (%d veces, se esperaban %d): %s' % (c, n, a[:100]))
    s = s.replace(a, b)

if modo == 'tienda':
    rep("guiaToca(linea) + linea('Universidad Steren del equipo', '<span id=\"uniDet\">Avance de cada persona</span>', 'var(--muted)', '<button class=\"btn\" id=\"uniVer\">Ver</button>')",
        "guiaToca(linea) + linea('Universidad Steren del equipo', '<span id=\"uniDet\">Avance de cada persona</span>', 'var(--muted)', '<button class=\"btn\" id=\"uniVer\">Ver</button>') + linea('📋 Proformas del equipo', '<span id=\"pfDet\">Seguimiento de cada asesor</span>', 'var(--muted)', '<button class=\"btn\" id=\"pfVer\">Ver</button>')")
    rep("  const ub = $('#uniVer'); if (ub) ub.onclick = uniAbrir;\n",
        "  const ub = $('#uniVer'); if (ub) ub.onclick = uniAbrir;\n  const pb = $('#pfVer'); if (pb) pb.onclick = pfTAbrir; pfTCargar().then(pfTDetalle, () => {});   // pf2:\n")
    FN = r'''/* pf2: proformas del POS de la tienda (gerente y subgerentes). Con datos del cliente: solo para la tienda. */
let PF_T = null;
function pfTCargar(f){ if (PF_T && !f) return Promise.resolve(PF_T); return api('apiPFTienda').then(x => (PF_T = x)); }
function pfTDetalle(){ const el = document.getElementById('pfDet'); if (!el || !PF_T) return;
  const ab = PF_T.filas.filter(x => x.estado === 'Abierta'), e = ab.filter(x => x.espera).length;
  el.textContent = ab.length ? ab.length + ' abiertas' + (e ? ' · ' + e + ' esperando más de 48 h' : ' · todas atendidas') : 'Sin proformas abiertas';
  el.style.color = e ? 'var(--bad)' : 'var(--muted)'; }
function pfTHtml(X){
  const usd = n => '$' + (Math.round(n * 100) / 100).toLocaleString('es-EC', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const fd = i => i ? new Date(i + 'T12:00:00').toLocaleDateString('es-EC', {weekday: 'short', day: 'numeric', month: 'short'}) : '';
  const hoy = new Date().toLocaleDateString('en-CA', {timeZone: 'America/Guayaquil'}), mes = hoy.slice(0, 7);
  const L = X.filas, ab = L.filter(x => x.estado === 'Abierta'), P = {};
  L.forEach(x => { const k = x.asesor || 'Sin asesor en el POS'; const a = P[k] = P[k] || {n: k, ab: 0, esp: 0, cer: 0, mes: 0};
    if (x.estado === 'Abierta') { a.ab++; if (x.espera) a.esp++; } if (x.creada.slice(0, 7) === mes) a.mes++; if (x.estado === 'Compró' && (x.cierre || '').slice(0, 7) === mes) a.cer++; });
  const J = X.juego || {tienda: {}};
  const tile = (l, v, c) => '<div style="flex:1;background:rgba(127,127,127,.1);border-radius:12px;padding:10px"><div class="small muted">' + l + '</div><div style="font-size:20px;font-weight:800;color:' + (c || 'inherit') + '">' + v + '</div></div>';
  const opts = sel => (X.gente || []).map(g => '<option' + (g === sel ? ' selected' : '') + '>' + esc(g) + '</option>').join('');
  return '<div style="display:flex;gap:8px;margin-bottom:12px">' + tile('Abiertas', ab.length) + tile('Esperando +48 h', ab.filter(x => x.espera).length, 'var(--bad)') + tile('Cierre del mes', J.tienda && J.tienda.n ? Math.round(J.tienda.pct * 100) + '%' : '—', 'var(--ok)') + '</div>' +
    '<h4 style="margin:6px 0">Por asesor</h4><div class="uni-t"><table><thead><tr><th>Asesor</th><th>Abiertas</th><th>Esperando</th><th>Del mes</th><th>Cerradas</th></tr></thead><tbody>' +
    Object.keys(P).map(k => P[k]).sort((a, b) => b.esp - a.esp || b.ab - a.ab).map(a => '<tr><td class="n"><b>' + esc(a.n) + '</b></td><td>' + a.ab + '</td><td style="color:' + (a.esp ? 'var(--bad);font-weight:700' : 'inherit') + '">' + a.esp + '</td><td>' + a.mes + '</td><td>' + a.cer + (a.mes ? ' <span class="uni-s">' + Math.round(a.cer / a.mes * 100) + '%</span>' : '') + '</td></tr>').join('') + '</tbody></table></div>' +
    '<h4 style="margin:14px 0 6px">Abiertas</h4>' + (ab.length ? ab.sort((a, b) => b.espera - a.espera || (a.creada < b.creada ? -1 : 1)).map(x =>
      '<div style="border:1px solid rgba(127,127,127,.25);border-radius:12px;padding:10px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:8px"><b>' + esc(x.cliente) + '</b><b>' + usd(x.monto) + '</b></div>' +
      '<div class="small">' + esc(x.productos) + '</div><div class="small muted">' + (x.doc ? 'Proforma ' + esc(x.doc) + ' · ' : '') + fd(x.creada) + (x.cel ? ' · ' + esc(x.cel) : '') + '</div>' +
      '<div class="small" style="margin-top:4px">' + (x.fuera ? '<span class="uni-e a">Ya no está en el POS: falta que confirme</span>' : x.espera ? '<span class="uni-e r">Esperando sin contacto</span>' : x.hist.length ? '<span class="uni-e o">Último: ' + esc(x.hist[x.hist.length - 1].res) + ' · ' + fd(x.hist[x.hist.length - 1].f) + '</span>' : '<span class="uni-e">En plazo</span>') + '</div>' +
      '<div style="display:flex;gap:6px;align-items:center;margin-top:8px"><span class="small muted">Asesor</span><select class="pf-reas" data-id="' + esc(x.id) + '" style="flex:1;min-height:36px">' + (x.asesor ? '' : '<option value="">(sin asesor)</option>') + opts(x.asesor) + '</select></div></div>').join('')
      : '<div class="small muted">No hay proformas abiertas.</div>') +
    (Object.keys(X.motivos || {}).length ? '' : '') + '<div class="uni-s" style="margin-top:8px">Llegan solas cada día desde los pedidos sin facturar del POS. "Esperando" = más de 48 h sin ningún contacto. Cambiar el asesor se la pasa a otra persona.</div>';
}
function pfTAbrir(){
  openModal('<h3 style="margin-top:0">📋 Proformas · ' + esc(S.data.tienda) + '</h3><div id="pfB" class="small muted">Cargando…</div><button class="btn" id="pfX" style="width:100%;margin-top:12px">Cerrar</button>');
  $('#pfX').onclick = closeModal;
  const pinta = X => { const b = $('#pfB'); if (!b) return; b.className = ''; b.innerHTML = pfTHtml(X);
    b.querySelectorAll('.pf-reas').forEach(sel => sel.onchange = () => { if (!sel.value) return; sel.disabled = true;
      api('apiPFReasignar', sel.dataset.id, sel.value).then(() => pfTCargar(true)).then(Y => { pinta(Y); pfTDetalle(); }, e => { sel.disabled = false; alert(e.message); }); }); };
  pfTCargar(true).then(X => { pinta(X); pfTDetalle(); }, e => { const b = $('#pfB'); if (b) b.textContent = e.message; });
}
function uniAbrir(){'''
    rep("function uniAbrir(){", FN)
elif modo == 'panel':
    rep('    <div id="recBody" style="margin-top:26px"><div class="skeleton">Cargando reclamos…</div></div>\n',
        '    <div id="recBody" style="margin-top:26px"><div class="skeleton">Cargando reclamos…</div></div>\n    <div id="pfBody" style="margin-top:26px"></div>\n')
    rep("    api('apiClientesPanel').then(x => {", "    api('apiPFPanel', st.pfPer || 'mes').then(x => { st.pf = x; renderPF(); }).catch(() => {});   // pf2:\n    api('apiClientesPanel').then(x => {")
    FN = r'''/* pf2: proformas del POS, SOLO números por tienda (sin clientes ni notas) */
function renderPF(){
  const el = $('#pfBody'); if (!el || !st.pf) return;
  const X = st.pf, T = X.tiendas.filter(t => enCiudad(t.tienda)), sum = k => T.reduce((a, t) => a + t[k], 0);
  const usd = n => '$' + Math.round(n).toLocaleString('es-EC');
  const n = sum('n'), cer = sum('cerradas'), ev = sum('evaluables'), at = sum('aTiempo');
  const per = st.pfPer || 'mes', seg = [['semana', 'Esta semana'], ['mes', 'Este mes'], ['mesAnt', 'Mes pasado']].map(([k, l]) => '<button class="btn' + (k === per ? ' primary' : '') + '" data-pfp="' + k + '">' + l + '</button>').join(' ');
  const M = X.motivos || {}, mt = Object.keys(M).sort((a, b) => M[b] - M[a]);
  el.innerHTML = '<div class="panel-h"><h2>📋 Proformas<span class="cfil"></span></h2><span class="small faint">Pedidos sin facturar del POS que cada asesor sigue con su cliente. Solo números.</span></div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px">' + seg + '</div>' +
    '<div class="uni-res"><span class="uni-e">' + n + ' nuevas · ' + usd(sum('monto')) + '</span><span class="uni-e ' + (ev && at / ev >= 0.8 ? 'o' : 'a') + '">' + (ev ? Math.round(at / ev * 100) : 0) + '% contactadas en 48 h</span><span class="uni-e ' + (sum('sinContacto') ? 'r' : 'o') + '">' + sum('sinContacto') + ' esperando sin contacto</span><span class="uni-e o">' + cer + ' cerradas · ' + usd(sum('cerradoUsd')) + (n ? ' · ' + Math.round(cer / n * 100) + '%' : '') + '</span><span class="uni-e">' + sum('perdidas') + ' perdidas</span></div>' +
    (T.length ? '<div class="uni-t"><table><thead><tr><th>Tienda</th><th>Nuevas</th><th>Valor</th><th>Contacto 48 h</th><th>Esperando</th><th>Cerradas</th><th>Cierre</th><th>Vendido</th><th>Perdidas</th></tr></thead><tbody>' +
      T.map(t => '<tr><td class="n"><b>' + esc(t.tienda) + '</b></td><td>' + t.n + '</td><td class="n">' + usd(t.monto) + '</td><td>' + (t.evaluables ? Math.round(t.aTiempo / t.evaluables * 100) + '%' : '—') + '</td><td' + (t.sinContacto >= 5 ? ' style="color:#c0352b;font-weight:700"' : '') + '>' + t.sinContacto + '</td><td>' + t.cerradas + '</td><td>' + (t.n ? Math.round(t.cerradas / t.n * 100) + '%' : '—') + '</td><td class="n">' + usd(t.cerradoUsd) + '</td><td>' + t.perdidas + '</td></tr>').join('') + '</tbody></table></div>'
      : '<div class="small faint">Todavía no hay proformas en este periodo.</div>') +
    (mt.length ? '<div class="small" style="margin-top:8px"><b>Por qué se pierden:</b> ' + mt.map(m => esc(m) + ' ' + M[m]).join(' · ') + '</div>' : '') +
    '<div class="uni-s" style="margin-top:6px">"Esperando" = abiertas con más de 48 h sin ningún contacto. Cierre = cerradas ÷ nuevas del periodo.</div>';
  el.querySelectorAll('[data-pfp]').forEach(b => b.onclick = () => { st.pfPer = b.dataset.pfp; api('apiPFPanel', st.pfPer).then(x => { st.pf = x; renderPF(); }).catch(() => {}); });
}
function renderUniversidad(){'''
    rep("function renderUniversidad(){", FN)
else:
    sys.exit('modo: tienda | panel')
open(p, 'w', encoding='utf-8').write(s)
print('pf2', modo, 'aplicado:', p)
