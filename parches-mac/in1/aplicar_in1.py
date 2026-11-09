#!/usr/bin/env python3
"""in1 (Diego 9-nov): Hoy pasa a llamarse Inicio, con 4 sub-opciones.
Uso: python3 aplicar_in1.py <archivo.html>   (admin, panel del espejo o Panel.html). Idempotente."""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if '/* in1 */' in s: print('ya aplicado', p); sys.exit(0)
def rep(a, b, n=1, opc=False):
    global s
    c = s.count(a)
    if c == 0 and opc: return
    if c != n: sys.exit('ancla %r aparece %d veces en %s' % (a[:60], c, p))
    s = s.replace(a, b)
rep('<button data-v="hoy">Hoy</button>', '<button data-v="hoy">Inicio</button>')
rep('"hoy": [["hoy", "", "Hoy"]]', '"hoy": [["hoy", "val", "Esperan tu validación"], ["hoy", "sup", "Posiciones de supervisión"], ["hoy", "ven", "Ventas vs presupuesto"], ["hoy", "act", "Actividades del mes"]]')
rep('{"id": "hoy", "nombre": "Hoy", "vistas": ["hoy"]}', '{"id": "hoy", "nombre": "Inicio", "vistas": ["hoy"]}')
rep('{"t": "Hoy", "v": "hoy", "sub": "Resumen, mapa y validar"', '{"t": "Inicio", "v": "hoy", "sub": "Validar, supervisión, ventas y actividades"', opc=True)
rep("hoy: 'Hoy', flash:", "hoy: 'Inicio', flash:")
rep('<h2>Esperan validación <span class="bx-n"', '<h2>Esperan tu validación <span class="bx-n"', opc=True)
rep("    if (v === 'inventario' && MN_SUB[v] === 'stock') mrcStock(el);   // mrc1\n",
    "    if (v === 'inventario' && MN_SUB[v] === 'stock') mrcStock(el);   // mrc1\n"
    "    if (v === 'hoy' && MN_SUB[v] === 'ven' && typeof M !== 'undefined' && M.ok) requestAnimationFrame(() => mDraw());   // in1\n")
# mp3 (solo donde existe): claves inicio/*; 'hoy/hoy' de la hoja vieja sigue dando todo Inicio
rep("const K = {'hoy|': 'hoy/hoy', ", "const K = {'hoy|val': 'inicio/validacion', 'hoy|sup': 'inicio/supervision', 'hoy|ven': 'inicio/ventas', 'hoy|act': 'inicio/actividades', ", opc=True)
rep("    const A = new Set(cfg.claves), M = window.MN_T_REF,",
    "    const A = new Set(cfg.claves), M = window.MN_T_REF;   // in1\n    if (A.has('hoy/hoy')) ['validacion', 'supervision', 'ventas', 'actividades'].forEach(x => A.add('inicio/' + x));\n    const",
    opc=True)
H = '.view[data-view="hoy"][data-sub]'
css = ('<style>/* in1 */'
  + H + '[data-sub="val"]>:not(#datoDia):not(.bx-wrap):not(.mn-chips),'
  + H + '[data-sub="sup"]>:not(#datoDia):not(.hl-sec:has(#hlSup)):not(.mn-chips),'
  + H + '[data-sub="ven"]>:not(#datoDia):not(.hl-sec:has(#hlVen)):not(.bx-mapa):not(.mn-chips),'
  + H + '[data-sub="act"]>:not(#datoDia):not(#actividades):not(.mn-chips){display:none!important}'
  + H + '[data-sub="act"] #actividades{display:block!important}'
  + H + '[data-sub="act"] #acBody:empty::before{content:"No hay actividades este mes.";color:var(--muted,#888);font-size:14px}'
  + '</style>\n')
i = s.rfind('</body>'); s = s[:i] + css + s[i:]
open(p, 'w', encoding='utf-8').write(s); print('ok', p)
