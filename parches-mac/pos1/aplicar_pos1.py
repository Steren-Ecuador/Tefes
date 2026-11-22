"""pos1 (21-nov-2026, Diego): 'Tiendas: detalle de ventas y supervision' pasa a ser una tabla de posiciones
solo con datos de supervision: una fila por tienda, ordenadas por el puntaje del mes, y las ultimas 6 semanas
(lunes a domingo) como circulos: color + puntaje si hubo supervision o autosupervision, X si no hubo, vacio si es
la semana en curso y aun no hay. Tocar una tienda sigue abriendo su detalle.
Uso: python3 aplicar_pos1.py archivo.html   (admin, Panel.html, panel.html; idempotente)"""
import sys, re
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* pos1 */' in s:
    print('ya estaba'); sys.exit(0)

HELPER = r'''/* pos1 */
function pos1Lunes(iso){ const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.toISOString().slice(0, 10); }
function pos1Sem(iso){ const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); const a = new Date(d.getFullYear(), 0, 4, 12); return 1 + Math.round((d - a) / 864e5 / 7 - (3 - (a.getDay() + 6) % 7) / 7 + 0.0001); }
function pos1Html(filas, hoy, masBaja){
  const MES = String(hoy).slice(0, 7), L0 = pos1Lunes(hoy), SEM = [];
  for (let k = 5; k >= 0; k--) { const d = new Date(L0 + 'T12:00'); d.setDate(d.getDate() - 7 * k); const ini = d.toISOString().slice(0, 10); d.setDate(d.getDate() + 6); SEM.push({ini, fin: d.toISOString().slice(0, 10), n: pos1Sem(ini)}); }
  const fc = x => +x.slice(8, 10) + '/' + +x.slice(5, 7);
  const cl = v => v >= 0.9 ? 'good' : v >= 0.71 ? 'warn' : 'bad';
  const R = filas.map(f => {
    const ss = ((st.d && st.d.sups) || []).filter(s => s.tienda === f.t.nombre && s.total != null && s.fecha).sort((a, b) => a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : String(a.id).localeCompare(String(b.id)));
    const mes = ss.filter(s => String(s.fecha).slice(0, 7) === MES);
    const pts = mes.length ? mes.reduce((a, s) => a + s.total, 0) / mes.length : (f.ult && f.ult.total != null ? f.ult.total : null);
    const c = {good: 0, warn: 0, bad: 0, no: 0};
    const w = SEM.map((S, k) => { const en = ss.filter(s => s.fecha >= S.ini && s.fecha <= S.fin), u = en[en.length - 1], act = k === SEM.length - 1, t = 'S' + S.n + ' (' + fc(S.ini) + ' a ' + fc(S.fin) + ')';
      if (!u) { if (act) return `<i class="pos1-b pos1-na" title="${t}: semana en curso, todavía sin supervisión"></i>`; c.no++; return `<i class="pos1-b pos1-no" title="${t}: no hubo supervisión ni autosupervisión">✕</i>`; }
      c[cl(u.total)]++; return `<i class="pos1-b pos1-${cl(u.total)}${act ? ' pos1-ult' : ''}" title="${t}: ${Math.round(u.total * 100)}% · ${esc(u.tipo || 'Supervisión')}${en.length > 1 ? ' (' + en.length + ' esa semana, va la última)' : ''}">${Math.round(u.total * 100)}</i>`; }).join('');
    return {f, pts, mesN: mes.length, c, w};
  }).sort((a, b) => (b.pts == null ? -1 : b.pts) - (a.pts == null ? -1 : a.pts) || String(a.f.t.nombre).localeCompare(String(b.f.t.nombre)));
  const n = R.length;
  return `<table class="exec pos1 no-mv"><thead><tr><th>#</th><th>Tienda</th><th class="num" title="Supervisiones que cuentan para la meta de 6 del mes">Mes</th><th class="num pos1-oc" title="Semanas con 90% o más">Verde</th><th class="num pos1-oc" title="Semanas de 71% a 89%">Ámbar</th><th class="num pos1-oc" title="Semanas con 70% o menos">Rojo</th><th class="num pos1-oc" title="Semanas sin supervisión ni autosupervisión">Sin sup.</th><th class="pos1-oc">Pendientes</th><th class="pos1-oc">Sección más baja</th><th class="num">Pts</th><th style="text-align:center">Últimas 6 semanas<div class="pos1-sh">${SEM.map(S => `<span title="${fc(S.ini)} a ${fc(S.fin)}">S${S.n}</span>`).join('')}</div></th></tr></thead><tbody>` +
    R.map((r, i) => { const f = r.f, sinMes = !r.mesN;
      const pend = [f.ab ? `<span${f.venc ? ' style="color:var(--bad);font-weight:600"' : ''}>${f.ab}</span>` : '<span class="zero">–</span>', f.venc ? `<span class="pill p-bad">${f.venc} venc.</span>` : '', f.val ? `<span class="pill p-acc">${f.val} por validar</span>` : ''].filter(Boolean).join(' ');
      return `<tr class="click${i < 3 && n > 4 ? ' pos1-top' : i >= n - 2 && n > 4 ? ' pos1-baja' : ''}" data-t="${esc(f.t.nombre)}"><td class="pos1-pos">${i + 1}</td><td class="store">${esc(f.t.nombre)}</td>
        <td class="num">${m6Pill(f.m6).replace(/>(\d+) de 6 en el mes</, '>$1/6<')}</td><td class="num pos1-oc" style="color:var(--good)">${r.c.good}</td><td class="num pos1-oc" style="color:var(--warn)">${r.c.warn}</td><td class="num pos1-oc" style="color:var(--bad)">${r.c.bad}</td><td class="num pos1-oc">${r.c.no}</td>
        <td class="pos1-oc"><div class="pcell">${pend}</div></td><td class="pos1-oc">${masBaja(f.ult)}</td>
        <td class="num"><b class="pos1-pts" style="color:var(--${sinMes ? 'muted, #94a3b8' : band(r.pts)})" title="${sinMes ? 'Sin evaluación este mes: es la última, de antes' : 'Promedio de las evaluaciones del mes (' + r.mesN + ')'}">${r.pts == null ? '–' : Math.round(r.pts * 100) + (sinMes ? '*' : '')}</b></td>
        <td><div class="pos1-w">${r.w}</div></td></tr>`; }).join('') +
    `</tbody></table><p class="small faint" style="margin:0;padding:10px 12px;border-top:1px solid var(--line)">Cada círculo es una semana de lunes a domingo, con el puntaje de la última supervisión o autosupervisión de esa semana. ✕ = semana sin ninguna; vacío = semana en curso, todavía sin hacer. Pts = promedio de las evaluaciones del mes (* = sin evaluación este mes, va la última). Verde ≥ 90% · ámbar 71–89% · rojo ≤ 70%. Franja azul = primeros 3, roja = últimos 2.</p>`;
}
'''
CSS = '<style>/* pos1 */.pos1 td,.pos1 th{white-space:nowrap}.pos1 .pos1-pos{position:relative;font-weight:600;color:var(--muted,#64748b);width:34px}.pos1 tr.pos1-top td.pos1-pos{box-shadow:inset 5px 0 0 #0078BE}.pos1 tr.pos1-baja td.pos1-pos{box-shadow:inset 5px 0 0 var(--bad)}.pos1-pts{font-size:17px}.pos1 td.pos1-pos{padding-left:10px!important}.pos1-w,.pos1-sh{display:flex;gap:5px;justify-content:center}.pos1-sh{margin-top:4px;font-size:10px;font-weight:500}.pos1-sh span{width:28px;text-align:center}.pos1-b{width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;font-style:normal;flex:none}.pos1-good{background:var(--good)}.pos1-warn{background:var(--warn)}.pos1-bad{background:var(--bad)}.pos1-no{background:#2b2f3a}.pos1-na{border:2px solid #c9ced8;background:transparent}.pos1-ult{outline:2px solid #0078BE;outline-offset:2px}@media(max-width:700px){.pos1 .pos1-oc{display:none!important}.pos1 td,.pos1 th{padding-left:2px!important;padding-right:2px!important;font-size:12px}.pos1 th:last-child{white-space:normal;font-size:10px}.pos1 td.store{white-space:normal;font-size:13px;max-width:92px}.pos1 .pill{padding:1px 5px;font-size:11px}.pos1 .pos1-pos{width:22px}.pos1-b{width:18px;height:18px;font-size:8px}.pos1-ult{outline-offset:1px}.pos1-w,.pos1-sh{gap:2px}.pos1-sh span{width:18px;font-size:7px}.pos1-pts{font-size:14px}}#stores table.pos1{display:table!important}#stores table.pos1 thead{display:table-header-group!important}#stores table.pos1 tbody{display:table-row-group!important}#stores table.pos1 tr{display:table-row!important}#stores table.pos1 td,#stores table.pos1 th{display:table-cell!important}#stores table.pos1 td.pos1-oc,#stores table.pos1 th.pos1-oc{display:none!important}@media(min-width:701px){#stores table.pos1 td.pos1-oc,#stores table.pos1 th.pos1-oc{display:table-cell!important}}</style>'

# 1) ayudante antes de render()
A = '\nfunction render(){\n'
i = s.index('const m6Pill = ')
j = s.index(A, i)
s = s[:j] + '\n' + HELPER + s[j:]
# 2) la tabla
ini = s.index("  $('#stores').innerHTML = !filas.length ? ")
fin = s.index("  document.querySelectorAll('#stores tr.click').forEach(tr => tr.onclick = () => detalleTienda(tr.dataset.t));", ini)
viejo = s[ini:fin]
m = re.match(r"  \$\('#stores'\)\.innerHTML = !filas\.length \? (.+?) :\n", viejo, re.S)
assert m, 'no encontre la tabla'
s = s[:ini] + "  $('#stores').innerHTML = !filas.length ? " + m.group(1) + " : pos1Html(filas, hoy, masBaja);   // pos1\n" + s[fin:]
# 3) titulo y ayuda
t0 = s.count('Tiendas: detalle de ventas y supervisión')
s = s.replace('<h2>Tiendas: detalle de ventas y supervisión', '<h2>Tiendas: tabla de posiciones de supervisión')
s = s.replace('Peor puntaje de supervisión primero. Toca una tienda para ver su detalle.', 'Mejor puntaje del mes primero. Toca una tienda para ver su detalle.')
# 4) estilos
k = s.rindex('</body>')
s = s[:k] + CSS + '\n' + s[k:]
open(p, 'w', encoding='utf-8').write(s)
print('ok pos1', p, 'titulos:', t0)
