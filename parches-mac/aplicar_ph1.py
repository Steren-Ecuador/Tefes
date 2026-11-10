#!/usr/bin/env python3
"""ph1 (Diego 10-nov): Uso app > "Por hora". Resumen de toda la actividad de la app por hora o media hora de un día:
ingresos de tiendas, asesores, equipo con código, tiempo activo, acciones, qué vieron y cargas lentas/errores. Solo admin.
Uso: python3 aplicar_ph1.py <admin.html>. Idempotente."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* ph1 */' in s: print('ya aplicado', p); sys.exit(0)
def rep(a, b):
    global s
    c = s.count(a)
    if c != 1: sys.exit('ancla %r aparece %d veces en %s' % (a[:70], c, p))
    s = s.replace(a, b)
rep('"uso": [["equipo", "per", "Uso por perfil"], ["equipo", "sup", "Equipo de supervisión"]]',
    '"uso": [["equipo", "per", "Uso por perfil"], ["equipo", "hora", "Por hora"], ["equipo", "sup", "Equipo de supervisión"]]')
rep("['uso','Uso app',[['per','Uso por perfil',1],['sup','Equipo de supervisión',1]]],",
    "['uso','Uso app',[['per','Uso por perfil',1],['hora','Por hora',1],['sup','Equipo de supervisión',1]]],")
rep("'equipo|per': 'uso/per', 'equipo|sup': 'uso/sup',", "'equipo|per': 'uso/per', 'equipo|hora': 'uso/hora', 'equipo|sup': 'uso/sup',")
rep("    if (v === 'equipo' && MN_SUB[v] === 'per' && window.usoPerfiles) usoPerfiles(el);   // up1\n",
    "    if (v === 'equipo' && MN_SUB[v] === 'per' && window.usoPerfiles) usoPerfiles(el);   // up1\n    if (v === 'equipo' && MN_SUB[v] === 'hora' && window.usoHora) usoHora(el);   // ph1\n")
rep("if (v === 'equipo' && MN_SUB[v] === 'per' && window.usoPerfiles) usoPerfiles(el); }); })",
    "if (v === 'equipo' && MN_SUB[v] === 'per' && window.usoPerfiles) usoPerfiles(el); if (v === 'equipo' && MN_SUB[v] === 'hora' && window.usoHora) usoHora(el); }); })")
rep(".closest('.mn-ctw,.mn-chips,#mnAse,#mrcStock,#usoPer'))", ".closest('.mn-ctw,.mn-chips,#mnAse,#mrcStock,#usoPer,#usoHora'))")
JS = r'''<style>/* ph1 */
.view[data-view="equipo"][data-sub="hora"]>:not(#usoHora):not(.mn-chips){display:none!important}
.view[data-view="equipo"]:not([data-sub="hora"])>#usoHora{display:none!important}
.ph-ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 12px}.ph-ctl input,.ph-ctl select{font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--surface,#fff);color:inherit}
.ph-kpi{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}.ph-kpi div{border:1px solid var(--line);border-radius:10px;padding:8px 12px;min-width:110px}.ph-kpi b{display:block;font-size:20px;font-variant-numeric:tabular-nums}.ph-kpi span{font-size:12px;color:var(--muted,#6b7280)}
#usoHora table td{vertical-align:top}#usoHora .ph-q{font-size:12px;color:var(--muted,#6b7280);max-width:260px}
.ph-bar{height:6px;border-radius:3px;background:var(--accent,#0b5394);opacity:.75;margin-top:4px;min-width:2px}
.ph-al{font-size:12px;color:#b45309}.ph-err{font-size:12px;color:#b91c1c}
</style>
<script>/* ph1: actividad de la app por hora o media hora */
window.PH = window.PH || {dia: '', paso: 60};
window.usoHora = function(view){
  let w = view.querySelector(':scope > #usoHora');
  if (!w) { w = document.createElement('section'); w.id = 'usoHora'; w.className = 'panel'; const c = view.querySelector(':scope > .mn-chips'); c ? c.after(w) : view.prepend(w);
    w.addEventListener('change', e => { if (e.target.id === 'phDia') PH.dia = e.target.value; if (e.target.id === 'phPaso') PH.paso = +e.target.value; usoHora(view); }); }
  if (typeof regLimpio !== 'function' || st.rg === undefined || !st.d) { if (!w.innerHTML) w.innerHTML = '<div class="skeleton">Cargando la actividad…</div>'; return; }
  const hoy = hoyISO(), dia = PH.dia || hoy, paso = PH.paso || 60;
  const mins = h => { const m = String(h || '').match(/(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
  const hh = m => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
  const F = {}, tot = {ti: 0, tiSet: new Set(), ase: new Set(), eq: new Set(), eqN: 0, seg: 0, acc: 0, alr: 0};
  const fr = k => F[k] = F[k] || {ti: 0, tiSet: {}, ase: new Set(), eq: new Set(), eqN: 0, seg: 0, acc: [], vis: {}, alr: []};
  regLimpio().forEach(r => {
    if (iso(r[0]) !== dia) return; const m = mins(r[1]); if (m === null) return;
    const f = fr(Math.floor(m / paso) * paso), panel = String(r[2] || ''), quien = String(r[3] || ''), ev = r[4], det = String(r[5] || '');
    const admin = /^Panel admin/.test(det), aseN = panel === 'Tienda' && ev === 'Ingreso' && /^Asesor: /.test(det) && !/eligiendo/i.test(det) ? det.replace(/^Asesor: /, '').replace(/ · correo.*$/, '').trim() : '';
    if (ev === 'Ingreso') {
      if (aseN) { f.ase.add(aseN + ' (' + quien + ')'); tot.ase.add(aseN); }
      else if (panel === 'Tienda') { f.ti++; f.tiSet[quien] = (f.tiSet[quien] || 0) + 1; tot.ti++; tot.tiSet.add(quien); }
      else { f.eqN++; tot.eqN++; const n = admin ? 'Tú (admin)' : quien; if (n && !/sin identificarse/.test(n)) { f.eq.add(n); tot.eq.add(n); } }
    }
    if (ev === 'Tiempo' && !admin) { const x = Number(r[6]) || 0; f.seg += x; tot.seg += x; }   // el admin guarda su tiempo acumulado en una sola fila
    if (ev === 'Vista' && det) f.vis[det] = (f.vis[det] || 0) + 1;
    if (ev === 'Acción') { f.acc.push(quien + ': ' + det); tot.acc++; }
    if (ev === 'Carga') { const d = det.match(/datos ([\d,.]+) s/), x = d ? parseFloat(d[1].replace(',', '.')) : null;
      if (/error|sin respuesta/i.test(det)) { f.alr.push('<span class="ph-err">' + esc(quien) + ': sin conexión o error</span>'); tot.alr++; }
      else if (x !== null && x >= 15) { const c = (det.match(/servidor [\d,]+ s: ([^,]+)/) || [])[1]; f.alr.push('<span class="ph-al">' + esc(quien) + ': ' + Math.round(x) + ' s' + (c ? ' (' + esc(c.replace(/ [\d,]+$/, '')) + ')' : '') + '</span>'); tot.alr++; } }
  });
  const ks = Object.keys(F).map(Number).filter(k => { const f = F[k]; return f.ti || f.ase.size || f.eqN || f.seg || f.acc.length || f.alr.length || Object.keys(f.vis).length; }).sort((a, b) => a - b), maxSeg = Math.max(1, ...ks.map(k => F[k].seg));
  const nT = st.d.tiendas.filter(t => t.activa).length, z = v => v || '<span class="zero">0</span>';
  const ctl = '<div class="ph-ctl"><label class="small">Día <input type="date" id="phDia" value="' + dia + '" max="' + hoy + '"></label><label class="small">Ver <select id="phPaso"><option value="60"' + (paso === 60 ? ' selected' : '') + '>cada hora</option><option value="30"' + (paso === 30 ? ' selected' : '') + '>cada media hora</option></select></label></div>';
  const kpi = '<div class="ph-kpi"><div><b>' + tot.tiSet.size + ' de ' + nT + '</b><span>tiendas entraron (' + tot.ti + ' ingresos)</span></div><div><b>' + tot.ase.size + '</b><span>asesores entraron</span></div><div><b>' + tot.eq.size + '</b><span>del equipo con código</span></div><div><b>' + durTxt(tot.seg) + '</b><span>de uso activo</span></div><div><b>' + tot.acc + '</b><span>acciones registradas</span></div>' + (tot.alr ? '<div><b>' + tot.alr + '</b><span>cargas lentas o errores</span></div>' : '') + '</div>';
  const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => esc(x[0])).join(', ');
  const tabla = !ks.length ? '<p class="small faint" style="margin:6px">No hay actividad registrada ese día.</p>' :
    '<div class="scroll"><table><thead><tr><th>Hora</th><th class="num">Ingresos tiendas</th><th>Tiendas</th><th>Asesores</th><th>Equipo</th><th class="num">Uso activo</th><th class="num">Acciones</th><th>Lo más visto</th><th>Avisos</th></tr></thead><tbody>' +
    ks.map(k => { const f = F[k], ti = Object.entries(f.tiSet).sort((a, b) => b[1] - a[1]);
      return '<tr><td class="store">' + hh(k) + '–' + hh(k + paso) + '</td><td class="num">' + z(f.ti) + '</td><td class="ph-q">' + (ti.length ? ti.length + ': ' + ti.map(x => esc(x[0])).join(', ') : '–') + '</td>' +
        '<td class="ph-q">' + (f.ase.size ? f.ase.size + ': ' + [...f.ase].map(esc).join(', ') : '–') + '</td><td class="ph-q">' + (f.eqN ? [...f.eq].map(esc).join(', ') || f.eqN + ' sin identificarse' : '–') + '</td>' +
        '<td class="num">' + (f.seg ? durTxt(f.seg) : '<span class="zero">0</span>') + '<div class="ph-bar" style="width:' + Math.round(f.seg / maxSeg * 100) + '%"></div></td>' +
        '<td class="num"' + (f.acc.length ? ' title="' + esc(f.acc.join('\n')) + '"' : '') + '>' + z(f.acc.length) + '</td><td class="ph-q">' + (top(f.vis) || '–') + '</td><td>' + (f.alr.join('<br>') || '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  w.innerHTML = '<div class="panel-h"><h2>Actividad de la app por hora</h2><span class="small faint">' + (dia === hoy ? 'Hoy, hasta ahora' : esc(fmtF(dia))) + '</span></div>' + ctl + kpi + tabla +
    '<p class="small faint" style="margin:10px 6px 0">Uso activo = tiempo con la app en pantalla y con algún toque en los últimos 2 minutos (sin contar tu panel). Avisos: cargas de 15 s o más y errores de conexión. Acciones = lo que se guarda (pendientes, fotos, validaciones).</p>';
};
</script>
'''
i = s.rfind('</body>'); s = s[:i] + JS + s[i:]
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
