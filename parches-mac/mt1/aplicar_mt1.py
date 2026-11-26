#!/usr/bin/env python3
"""mt1 (26-nov-2026, Diego: "me preocupa que estén llenando solo por cumplir el inventario").
En la Revisión de inventario (admin y panel de supervisores):
1) cada producto muestra quién lo contó y cómo (Cámara, Foto o Digitado), 1.er y 2.º conteo;
2) arriba, un resumen por persona: productos, % digitado y tiempo típico por producto;
3) filtro "Digitados" y en ámbar los productos que solo se digitaron aunque tienen código de barras.
Datos: MueConteo (B semana, C tienda, D ronda, E persona, F código, G método, H cantidad, I fecha).
Uso: python3 aplicar_mt1.py archivo.html"""
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
if 'function mtArmar(' in s:
    print('ya estaba mt1'); sys.exit(0)

def rep(a, b, n=1):
    global s
    assert s.count(a) == n, 'no encontré: ' + a[:60]
    s = s.replace(a, b)

# 1) datos de MueConteo con método y hora
rep("  return (st.ivQ[k] = m);\n}",
    "  m.__mt = mtArmar(v.slice(1).filter(r => r[1] === sem && r[2] === tienda));   /* mt1 */\n  return (st.ivQ[k] = m);\n}")

# 3) filtro Digitados
rep("rev: ['Revisados', o => !!o.cr], todos: ['Todos', () => true]};",
    "rev: ['Revisados', o => !!o.cr], dig: ['Digitados', o => mtMet(ui, o.cod) === 'dig'], todos: ['Todos', () => true]};   /* mt1 */")

# 2) resumen por persona, debajo de los indicadores
rep("  let L = FA;\n",
    "  { const kp2 = $('#ivKp'); if (kp2 && ui.quien && ui.quien.__mt) kp2.insertAdjacentHTML('beforeend', mtResumen(ui.quien.__mt, FA.map(o => o.cod))); }   /* mt1 */\n  let L = FA;\n")

# 1) etiquetas en cada fila
i = s.index('const fila = o => { const cont')
a = '<span class="small faint">${esc(o.desc)}</span>'
j = s.index(a, i)
s = s[:j] + a + '${mtTags(ui, o)}' + s[j + len(a):]

# funciones y estilos
anc = "async function invQuien(sem, tienda){"
rep(anc, r"""/* mt1: cómo se contó cada producto (Cámara, Foto o Digitado) */
const mtTipo = m => /c[aá]mara/i.test(m) ? 'cam' : /foto/i.test(m) ? 'foto' : 'dig';
const mtNom = {cam: 'Cámara', foto: 'Foto', dig: 'Digitado'};
function mtArmar(R){
  const cod = {}, per = {};
  R.forEach(r => { const c = sinApo(r[5]), ro = String(r[3]) === '2' ? 2 : 1, t = Date.parse(String(r[8] || '').replace(' ', 'T')), x = {p: String(r[4] || ''), met: mtTipo(String(r[6] || '')), cant: r[7], t, ro, c};
    (cod[c] = cod[c] || {1: [], 2: []})[ro].push(x); (per[x.p] = per[x.p] || []).push(x); });
  return {cod, per};
}
function mtMet(ui, c){   // 'dig' si todas sus lecturas fueron digitadas
  const q = ui.quien && ui.quien.__mt && ui.quien.__mt.cod[c]; if (!q) return '';
  const L = q[1].concat(q[2]); if (!L.length) return '';
  return L.every(x => x.met === 'dig') ? 'dig' : L.some(x => x.met === 'cam') ? 'cam' : 'foto';
}
function mtTags(ui, o){
  const q = ui.quien && ui.quien.__mt && ui.quien.__mt.cod[o.cod]; if (!q) return '';
  const amb = mtMet(ui, o.cod) === 'dig' && String(o.barras || '').trim();
  return '<span class="mt-tags">' + [1, 2].filter(ro => q[ro].length).map(ro => q[ro].map(x =>
    `<span class="mt-tag mt-${x.met}${amb ? ' mt-amb' : ''}"${amb ? ' title="Tiene código de barras y solo se digitó"' : ''}>${ro}º ${esc(nombreCorto(x.p))} · ${mtNom[x.met]}</span>`).join('')).join('') + '</span>';
}
function mtSeg(s){ s = Math.round(s); return s < 60 ? s + ' s' : Math.floor(s / 60) + ' min' + (s % 60 ? ' ' + (s % 60) + ' s' : ''); }
function mtResumen(mt, codigos){
  const C = new Set(codigos), P = Object.keys(mt.per).map(p => {
    const L = mt.per[p].filter(x => C.has(x.c)); if (!L.length) return null;
    const dig = L.filter(x => x.met === 'dig').length, prods = new Set(L.map(x => x.c)).size, gaps = [];
    [1, 2].forEach(ro => { const T = L.filter(x => x.ro === ro && !isNaN(x.t)).map(x => x.t).sort((a, b) => a - b);
      for (let i = 1; i < T.length; i++) { const g = (T[i] - T[i - 1]) / 1000; if (g > 0 && g < 1800) gaps.push(g); } });
    gaps.sort((a, b) => a - b);
    return {p, prods, pd: Math.round(dig / L.length * 100), seg: gaps.length ? gaps[Math.floor(gaps.length / 2)] : null};
  }).filter(Boolean).sort((a, b) => b.pd - a.pd || b.prods - a.prods);
  if (!P.length) return '';
  return '<div class="mt-res"><div class="lbl">Cómo contaron</div>' + P.map(x =>
    `<div class="mt-per"><b>${esc(x.p)}</b><span>${x.prods} producto${x.prods === 1 ? '' : 's'}</span><span class="${x.pd >= 80 ? 'mt-alto' : ''}">${x.pd} % digitado</span><span>${x.seg == null ? '–' : mtSeg(x.seg) + ' por producto'}</span></div>`).join('') + '</div>';
}
(function(){ const st_ = document.createElement('style'); st_.textContent = `
.mt-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}
.mt-tag{font-size:11px;line-height:1.3;padding:1px 6px;border-radius:9px;background:#eef1f4;color:#44515c;white-space:nowrap}
.mt-tag.mt-cam{background:#e3f4e8;color:#1d6b35}.mt-tag.mt-foto{background:#e4eefb;color:#1f4f8f}
.mt-tag.mt-amb{background:#fff1cc;color:#7a5200;font-weight:600}
.mt-res{margin:8px 0 4px;padding:8px 10px;border:1px solid #e3e6ea;border-radius:10px}
.mt-per{display:grid;grid-template-columns:1.6fr 1fr 1fr 1.3fr;gap:6px;font-size:13px;padding:3px 0;border-top:1px solid #f0f2f4}
.mt-res .lbl + .mt-per{border-top:0}.mt-alto{color:#a15c00;font-weight:600}
@media (max-width:520px){.mt-per{grid-template-columns:1fr 1fr}}`; document.head.appendChild(st_); })();
""" + anc)
open(p, 'w', encoding='utf-8').write(s)
print('ok mt1', p)
