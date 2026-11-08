# ut1 (Diego 8-nov-2026, aprobó la maqueta https://claude.ai/artifact/VSKyn12yjVB6t5ok3Vj61o): Universidad Steren es un TEMA
# del menú principal (computadora y barra del celular), con 4 opciones: Tabla | Goleadores | Carreras | Alertas.
# - Vista nueva 'universidad' (botón en #tabs, VISTAS, TEM.temas, MN_T). Sale de Políticas (deshace ul1 en el menú).
# - En la barra del celular: Hoy, Supervisión, Ventas, Universidad, Más (Mercadería pasa a Más), como en la maqueta.
# - uniInformeHtml(U, true) arma las 4 partes; mn1 muestra la elegida con data-sub. La vista de tienda (todas=false) no cambia.
# - Datos por persona: car (4 carreras %), cert, pts, det. Admin los lee de la fila; Asesores.gs los manda en asUniFila_.
# Uso (idempotente): python3 aplicar_ut1.py <archivo> [...]  (admin index.html, Panel.html, panel.html del espejo, Asesores.gs)
import re, sys
JS = r"""/* ut1: Universidad como tema con 4 opciones (Tabla, Goleadores, Carreras, Alertas) */
function uniInformeHtml(U, todas, filtro){
  if (!todas) return uniInformeHtml0(U, todas, filtro);
  const tabla = uniTablaHtml(U, todas, filtro), F = (U && U.filas || []).filter(x => !filtro || filtro(x));
  if (!U || !U.fecha || !F.length) return tabla;
  const ca = x => x.carr != null ? x.carr : x.ok, mi = x => x.mic != null ? x.mic : 0, se = x => x.semC !== undefined ? x.semC : x.semana;
  const CAR = ['Onboarding', 'Fundamentos', 'Gestión Op.', 'Productos'], cc = (x, i) => Number((x.car || [])[i]) || 0;
  const G = {}; F.forEach(x => { const k = x.t || 'Sin tienda'; (G[k] = G[k] || {t: k, c: 0, P: []}); G[k].c += ca(x); G[k].P.push(x); });
  const T = Object.values(G).sort((a, b) => b.c - a.c || a.t.localeCompare(b.t));
  const tot = F.reduce((a, x) => a + ca(x), 0), sm = F.reduce((a, x) => a + (se(x) || 0), 0), rj = F.filter(x => x.estado === 'rojo').length;
  const kpis = '<div class="ut-k"><div><b>' + tot + '</b><span>cursos de carrera</span></div><div><b>' + (sm ? '+' + sm : '0') + '</b><span>en la semana</span></div><div><b class="r">' + rj + '</b><span>en alerta</span></div></div>';
  const L = F.slice().sort((a, b) => ca(b) - ca(a) || mi(b) - mi(a)).slice(0, 15), S = F.filter(x => se(x)).sort((a, b) => se(b) - se(a)).slice(0, 5);
  window.UT_F = F;
  const gol = '<div class="ut-h">Más cursos de carrera</div><table class="us no-mv"><colgroup><col class="c1"><col><col class="c3"><col class="c6"><col class="c5"></colgroup><thead><tr><th class="p">#</th><th class="l">Persona</th><th>Carrera</th><th>Micro</th><th>Cert.</th></tr></thead><tbody>' +
    L.map((x, i) => '<tr class="ut-pe" data-utp="' + F.indexOf(x) + '"><td class="p"><span class="us-n' + (i < 3 ? ' g' + (i + 1) : '') + '">' + (i + 1) + '</span></td><td class="l">' + esc(x.n) + '<span class="us-r">' + esc(x.t || '') + '</span></td><td class="k">' + ca(x) + '</td><td class="m">' + mi(x) + '</td><td>' + (x.cert != null ? x.cert : '—') + '</td></tr>').join('') + '</tbody></table>' +
    '<div class="ut-h">Figuras de la semana</div>' + (S.length ? S.map(x => '<div class="ut-al"><span>' + esc(x.n) + '<span class="us-r">' + esc(x.t || '') + '</span></span><b class="ok">+' + se(x) + ' de carrera</b></div>').join('') : '<div class="us-ley">Nadie aprobó cursos de carrera esta semana.</div>') +
    '<div class="us-ley">Toca a una persona para ver su ficha.</div><div class="ut-fi"></div>';
  const lleno = i => F.filter(x => cc(x, i) >= 100).length, barra = (n, v, t) => '<div class="ut-cr"><span>' + n + '</span><div class="ut-b"><i style="width:' + Math.round(v) + '%"></i></div><b>' + t + '</b></div>';
  const car = '<div class="ut-h">Personas con la carrera completa</div>' + CAR.map((n, i) => barra(n, lleno(i) / F.length * 100, lleno(i) + '/' + F.length)).join('') +
    '<div class="ut-h">Por tienda</div><table class="us no-mv"><colgroup><col><col class="c5"><col class="c5"><col class="c5"><col class="c5"></colgroup><thead><tr><th class="l">Tienda</th><th>Onb.</th><th>Fund.</th><th>Gest.</th><th>Prod.</th></tr></thead><tbody>' +
    T.map(g => '<tr><td class="l"><b>' + esc(g.t) + '</b><span class="us-r">' + g.P.length + (g.P.length === 1 ? ' persona' : ' personas') + '</span></td>' + [0, 1, 2, 3].map(i => { const k = g.P.filter(x => cc(x, i) >= 100).length; return '<td' + (k < g.P.length ? ' class="bad"' : '') + '>' + k + '/' + g.P.length + '</td>'; }).join('') + '</tr>').join('') +
    '</tbody></table><div class="us-ley">En rojo: falta alguien por terminar esa carrera. Las 4 carreras al 100 % son parte del punto C01 de la supervisión.</div>';
  const por = x => x.dias > 14 ? (x.visita ? 'hace ' + x.dias + ' días sin entrar' : 'nunca entró') : x.estado === 'rojo' ? x.faltan + ' pendientes y ningún curso en la semana' : x.dias > 7 ? 'hace ' + x.dias + ' días sin entrar' : x.faltan + ' cursos pendientes';
  const fA = x => '<div class="ut-al"><span>' + esc(x.n) + '<span class="us-r">' + esc(x.t || '') + ' · ' + por(x) + '</span></span><span class="ut-pill ' + (x.estado === 'rojo' ? 'r' : 'a') + '">' + (x.estado === 'rojo' ? 'Alerta' : 'Atención') + '</span></div>';
  const R = F.filter(x => x.estado === 'rojo').sort((a, b) => b.dias - a.dias), A = F.filter(x => x.estado === 'naranja').sort((a, b) => b.dias - a.dias);
  const al = '<div class="ut-h">🚨 En alerta (' + R.length + ')</div>' + (R.length ? R.map(fA).join('') : '<div class="us-ley">Nadie en alerta. 🎉</div>') + (A.length ? '<div class="ut-h">⚠️ En atención (' + A.length + ')</div>' + A.map(fA).join('') : '') +
    '<div class="us-ley">Alerta: más de 14 días sin entrar, o pendientes sin ningún curso aprobado en la semana. Atención: 8 a 14 días sin entrar o más de 10 pendientes.</div>';
  return '<div class="ut-p ut-tabla">' + kpis + tabla + '</div><div class="ut-p ut-gol">' + gol + '</div><div class="ut-p ut-car">' + car + '</div><div class="ut-p ut-al0">' + al + '</div>';
}
document.addEventListener('click', e => { const r = e.target.closest && e.target.closest('tr.ut-pe'); if (!r || !window.UT_F) return;
  const x = UT_F[+r.dataset.utp], w = r.closest('.ut-gol').querySelector('.ut-fi'); if (!x || !w) return;
  const ca = x.carr != null ? x.carr : x.ok, CAR = ['Onboarding', 'Fundamentos', 'Gestión Op.', 'Productos'];
  const li = (a, b) => '<div class="ut-al"><span>' + a + '</span><b>' + b + '</b></div>';
  w.innerHTML = '<div class="ut-h">' + esc(x.n) + ' · ' + esc(x.t || '') + '</div>' + (x.car ? CAR.map((n, i) => { const v = Number(x.car[i]) || 0; return '<div class="ut-cr"><span>' + n + '</span><div class="ut-b"><i style="width:' + v + '%"></i></div><b>' + v + '%</b></div>'; }).join('') : '') +
    li('Cursos de carrera', ca) + li('Microcursos', x.mic != null ? x.mic : 0) + (x.cert != null ? li('Certificados', x.cert) : '') + (x.pts != null ? li('Puntos', x.pts) : '') + li('Último ingreso', x.visita ? 'hace ' + x.dias + ' d' : 'nunca') +
    (x.det ? '<div class="us-ley">En curso: ' + esc(String(x.det).split(';').slice(0, 3).join(' · ')) + '</div>' : '');
  w.scrollIntoView({behavior: 'smooth', block: 'nearest'}); });
"""
CSS = """<style>/* ut1 */
.view[data-view="universidad"] .ut-p{display:none}
.view[data-view="universidad"][data-sub="tabla"] .ut-tabla,.view[data-view="universidad"][data-sub="gol"] .ut-gol,.view[data-view="universidad"][data-sub="car"] .ut-car,.view[data-view="universidad"][data-sub="al"] .ut-al0{display:block}
.view[data-view="universidad"]:not([data-sub]) .ut-tabla{display:block}
.ut-k{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:6px 0 10px}.ut-k div{border:1px solid var(--line,rgba(127,127,127,.25));border-radius:12px;padding:8px;text-align:center}
.ut-k b{display:block;font-size:20px;font-variant-numeric:tabular-nums}.ut-k b.r{color:#e5534b}.ut-k span{font-size:11.5px;opacity:.65}
.ut-h{font-weight:700;font-size:14px;margin:12px 0 6px}
.ut-al{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line,rgba(127,127,127,.18));font-size:14px}
.ut-al .us-r{display:block;font-size:11.5px;opacity:.6}.ut-al b.ok{color:#2da44e}
.ut-pill{flex:none;padding:1px 8px;border-radius:999px;font-size:11.5px;font-weight:600}.ut-pill.r{background:rgba(229,83,75,.15);color:#e5534b}.ut-pill.a{background:rgba(212,145,0,.16);color:#c98a00}
.ut-cr{display:grid;grid-template-columns:96px 1fr 46px;gap:8px;align-items:center;font-size:13.5px;padding:4px 0}.ut-cr b{text-align:right}
.ut-b{height:8px;border-radius:5px;background:rgba(127,127,127,.18);overflow:hidden}.ut-b i{display:block;height:100%;background:#2da44e}
table.us td.bad{color:#e5534b}table.us tr.ut-pe{cursor:pointer}table.us tr.ut-pe td.l .us-r{display:block;font-size:11.5px;opacity:.6}
</style>
"""
ICO = "M22 10 12 5 2 10l10 5 10-5zM6 12v5c3 2 9 2 12 0v-5"
def sub1(s, a, b, f, nombre):
    if s.count(a) != 1: sys.exit('ERROR %s: %s aparece %d veces' % (f, nombre, s.count(a)))
    return s.replace(a, b)
for f in sys.argv[1:]:
    s = open(f, encoding='utf-8').read()
    if 'ut1' in s: print('ya aplicado', f); continue
    if f.endswith('.gs'):
        s = sub1(s, "semC: x.semC, estado: x.estado});   // uc1", "semC: x.semC, estado: x.estado, pts: x.pts, det: x.det});   // uc1 ut1", f, 'asUniFila_')
        open(f, 'w', encoding='utf-8').write(s); print('ok ut1', f); continue
    adm = 'function uniDesdeFilas(' in s
    # 1) botón, vista y lista de vistas
    s = sub1(s, '    <button data-v="guias">Manuales y guías</button>\n', '    <button data-v="guias">Manuales y guías</button>\n    <button data-v="universidad">Universidad</button>\n', f, 'botón guías')
    s, k = re.subn(r"(const VISTAS = \[[^\]]*)'guias'", r"\1'guias','universidad'", s, count=1)
    if k != 1: sys.exit('ERROR %s: VISTAS' % f)
    m = re.search(r'    <section class="panel" id="universidad" hidden>.*?</section>\n', s, re.S)
    if not m: sys.exit('ERROR %s: sección universidad' % f)
    sec = m.group(0).replace('<section class="panel" id="universidad" hidden>', '<section class="panel" id="universidad">'); s = s[:m.start()] + s[m.end():]
    i = s.index('<div class="view" data-view="guias" hidden>'); j = s.index('  </div>\n', i) + len('  </div>\n')
    s = s[:j] + '\n  <div class="view" data-view="universidad" hidden>   <!-- ut1 -->\n' + sec + '  </div>\n' + s[j:]
    # 2) menú por temas
    s = sub1(s, '{"id": "ventas", "nombre": "Ventas", "vistas": ["flash"]}', '{"id": "ventas", "nombre": "Ventas", "vistas": ["flash"]}, {"id": "universidad", "nombre": "Universidad", "vistas": ["universidad"]}', f, 'TEM.temas ventas')
    s = s.replace('["guias", "man", "Manuales y guías"], ["guias", "uni", "Universidad Steren"]', '["guias", "", "Manuales y guías"]')
    s = sub1(s, '"politicas": [', '"universidad": [["universidad", "tabla", "Tabla"], ["universidad", "gol", "Goleadores"], ["universidad", "car", "Carreras"], ["universidad", "al", "Alertas"]], "politicas": [', f, 'MN_T politicas')
    # 3) barra del celular (como la maqueta): Hoy, Supervisión, Ventas, Universidad, Más
    s = sub1(s, "const T_ABAJO = ['hoy', 'supervision', 'ventas', 'inventarios'];", "const T_ABAJO = ['hoy', 'supervision', 'ventas', 'universidad'];   // ut1", f, 'T_ABAJO')
    s = sub1(s, "const T_ICO = {hoy: P.hoy,", "const T_ICO = {universidad: '" + ICO + "', hoy: P.hoy,", f, 'T_ICO')
    # 4) informe: la tabla de us1/uc1 pasa a llamarse uniTablaHtml y uniInformeHtml arma las 4 partes
    s = sub1(s, "function uniInformeHtml(U, todas, filtro){\n  if (!todas) return uniInformeHtml0(U, todas, filtro);\n  const fd", JS + "function uniTablaHtml(U, todas, filtro){\n  const fd", f, 'uniInformeHtml uc1')
    # 5) admin: más datos por persona desde la fila
    if adm:
        s = sub1(s, "asig, ok, carr, mic, semC, visita, dias, semana, faltan,\n      estado:", "asig, ok, carr, mic, semC, visita, dias, semana, faltan, car: [n(r[5]), n(r[6]), n(r[7]), n(r[8])], cert: n(r[12]), pts: n(r[13]), det: String(r[15] || ''),   // ut1\n      estado:", f, 'return admin')
    b = s.rfind('</body>'); s = s[:b] + CSS + s[b:]
    open(f, 'w', encoding='utf-8').write(s); print('ok ut1', f)
