#!/usr/bin/env python3
"""mp5 (Diego 9-nov): el panel ordena temas y sub-opciones según 'Orden menú' y 'Orden opción' del perfil.
Requiere mp3 + in1 + vs1. Uso: python3 aplicar_mp5.py <panel.html|Panel.html>. Idempotente."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '// mp5' in s: print('ya aplicado', p); sys.exit(0)
def rep(a, b):
    global s
    c = s.count(a)
    if c != 1: sys.exit('ancla %r aparece %d veces en %s' % (a[:70], c, p))
    s = s.replace(a, b)
rep("  const T_ABAJO = ['hoy', 'supervision', 'ventas', 'universidad'];   // ut1\n",
    "  const T_ABAJO = ['hoy', 'supervision', 'ventas', 'universidad'];   // ut1\n  window.T_ABAJO_REF = T_ABAJO;   // mp5\n")
rep("""  function aplicar(cfg){
    window.MPF_CFG = cfg;
    if (!cfg || cfg.todo || !Array.isArray(cfg.claves)) return;""",
"""  function ordenar(cfg){   // mp5: orden de temas y sub-opciones del perfil (lo que no está en la hoja va al final)
    const O = Array.isArray(cfg && cfg.orden) ? cfg.orden : []; if (!O.length) return;
    const pos = {}; O.forEach((k, i) => { if (!(k in pos)) pos[k] = i; });
    const M = window.MN_T_REF, TT = window.TEM && window.TEM.temas; if (!M) return;
    const P = x => { const k = K[x[0] + '|' + x[1]]; return k && k in pos ? pos[k] : 1e9; }, rk = {};
    Object.keys(M).forEach(t => { const L = M[t].map((x, i) => [x, i]).sort((a, b) => P(a[0]) - P(b[0]) || a[1] - b[1]).map(z => z[0]); M[t].length = 0; L.forEach(x => M[t].push(x)); rk[t] = L.length ? Math.min(...L.map(P)) : 1e9; });
    if (Array.isArray(TT)) { const L = TT.map((t, i) => [t, i]).sort((a, b) => (t => t in rk ? rk[t] : 1e9)(a[0].id) - (t => t in rk ? rk[t] : 1e9)(b[0].id) || a[1] - b[1]).map(z => z[0]); TT.length = 0; L.forEach(t => TT.push(t)); }
  }
  function abajo(){   // mp5: barra del celular = los 4 primeros temas visibles
    const A = window.T_ABAJO_REF, TT = window.TEM && window.TEM.temas, tabs = document.getElementById('tabs'); if (!A || !Array.isArray(TT) || !tabs || !(window.MPF_CFG && (MPF_CFG.orden || []).length)) return;
    const vis = TT.filter(t => t.vistas.some(v => { const b = tabs.querySelector('button[data-v="' + v + '"]'); return b && !b.hidden && b.style.display !== 'none'; })).map(t => t.id).slice(0, 4);
    if (vis.length) { A.length = 0; vis.forEach(x => A.push(x)); }
  }
  function aplicar(cfg){
    window.MPF_CFG = cfg;
    ordenar(cfg);
    if (!cfg || cfg.todo || !Array.isArray(cfg.claves)) { abajo(); const t = document.getElementById('tabs'); if (t) t.dataset.mn = String(Date.now()); return; }""")
rep("""    if (on && on.hidden) { const p = [...tabs.querySelectorAll('button[data-v]')].find(b => !b.hidden && b.style.display !== 'none'); if (p) p.click(); }
    tabs.dataset.mn = String(Date.now());""",
"""    if (on && on.hidden) { const p = [...tabs.querySelectorAll('button[data-v]')].find(b => !b.hidden && b.style.display !== 'none'); if (p) p.click(); }
    abajo(); tabs.dataset.mn = String(Date.now());""")
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
